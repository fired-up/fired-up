const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { argv } = require('yargs');
const { eachLimit } = require('async');
const _difference = require('lodash/difference');

const presets = require('./presets/index.json');
const CONFIG = require('./config.json');

if (!argv.project) {
  console.error(
    'Run this commend with --project=% to set the correct GCP project'
  );
  process.exit(1);
}

// Validate that required service account token exists
if (!fs.existsSync(`../../key-${argv.project}.json`)) {
  console.error(
    `Download a Google service account JSON file, rename it to key-${argv.project}.json, and add it to the fired up root directory`
  );
  process.exit(1);
}

// Validate input file exists
if (!argv.input) {
  console.error('Run this command with --input=% Your CSV Path Here.csv %');
  process.exit(1);
}

// Validate that preset is valid if it is set
if (argv.preset && !presets[argv.preset]) {
  console.error(
    `${argv.preset} is not a valid preset. Please enter a valid preset or omit the preset argument to use the default settings (Fired Up field names)`
  );
  process.exit(1);
}

if (argv['create-users'] && argv['create-volunteers']) {
  console.warn(
    '--create-volunteers flag will take precedence over --create-users. All imported contacts will be flagged as volunteers.'
  );
}

const Processor = require('./library/csv.js');
const bigquery = require('./library/bigquery');
const firestore = require('./library/firestore.js');
const cloudtasks = require('./library/cloudtasks.js');
const { getUTMparams } = require('./library/fired-up.js');

/**
 * Main program
 */
(async function main() {
  let PRESET, CSV_FILENAME;
  let FORM_TYPE = 'signup';

  const CREATE_USERS = !!argv['create-users'];
  const CREATE_VOLUNTEERS = !!argv['create-volunteers'];

  if (argv.input) {
    CSV_FILENAME = `./${argv.input}`;
    console.log(`Importing ${CSV_FILENAME}`);
  }

  const csv = new Processor(CSV_FILENAME);

  // TODO: This should be an option for each preset and an CLI arg
  const FORM_ID = 'T2gLgcxdH63dIsNftzWh';
  const IMPORT_ID = `csv-${new Date().getTime()}`;
  const IMPORT_FILENAME = path.basename(CSV_FILENAME);

  console.log(`Import ID: ${IMPORT_ID}`);

  const ROW_IDS = [];

  // Load preset settings
  if (argv.preset) {
    PRESET = require(`./presets/${argv.preset}.json`);
  } else {
    PRESET = require(`./presets/default.json`);
  }

  // TODO: Field remapping will occur here

  // Validate CSV
  // TODO: Pass in field remapping object since that will occur within csv.processCSV
  console.log('Validating CSV File');
  const validationResults = await csv.processCSV(async (row, id) => {
    if (id === 0) {
      return;
    }

    for (const required_field of PRESET.required_fields) {
      if (!row[required_field]) {
        throw new Error(`Invalid or missing ${required_field}`);
      }
    }

    // TODO: in the future the date format should be specified in the Preset
    if (
      typeof row.created_at !== 'undefined' &&
      !moment(row.created_at, moment.ISO_8601, true).isValid()
    ) {
      throw new Error('Invalid created at date');
    }
  });

  // Exit if CSV has validation errors
  if (validationResults.errorsEncountered > 0) {
    console.log(
      'Some errors were found in your CSV. Please fix the following and attempt to re-run.'
    );
    console.log(validationResults);

    process.exit(1);
    return;
  }

  // Process CSV
  const utm = getUTMparams(argv);

  // Processing Results
  console.log(`Uploading CSV records`);
  const processingResults = await csv.processCSV(async (row, id) => {
    ROW_IDS.push(id);

    const signup = {
      utm, // TODO: allow UTM to be set per-row in the future
      url: null,
      type: FORM_TYPE,
      form_id: FORM_ID,
      created_at: row.created_at
        ? moment.utc(row.created_at).toISOString()
        : moment.utc().toISOString(),
      fields: {
        given_name: row.given_name || null,
        family_name: row.family_name || null,
        locality: row.locality || null,
        region: row.region || null,
        postal_code: row.postal_code || null,
        email_address: row.email_address || null,
        address_line1: row.address_line1 || null,
        address_line2: row.address_line2 || null,
        phone_number: row.phone_number || null,
        honorific_prefix: row.honorific_prefix || null,
        honorific_suffix: row.honorific_suffix || null,
        employer: row.employer || null,
        occupation: row.occupation || null,
      },
      importer: {
        row_id: id,
        import_id: IMPORT_ID,
        filename: IMPORT_FILENAME,
      },
    };

    if (CREATE_VOLUNTEERS) {
      signup.fired_up_custom_tasks = [
        'create_firebase_user',
        'interested_volunteer',
      ];
    } else if (CREATE_USERS) {
      signup.fired_up_custom_tasks = ['create_firebase_user'];
    }

    const body = Buffer.from(JSON.stringify(signup)).toString('base64');

    const task = {
      httpRequest: {
        body,
        httpMethod: 'POST',
        url: `https://us-central1-${argv.project}.cloudfunctions.net/importerCloudTasksProcessor`,
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Basic ${Buffer.from(
            'cloudtasks:' + CONFIG.auth_password
          ).toString('base64')}`,
        },
      },
    };

    try {
      await new Promise(resolve => cloudtasks.addTaskToQueue(task, resolve));
      //return;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  });

  console.log(
    'Waiting 5 minutes for Cloud Task and BigQuery processing to complete'
  );
  await new Promise(resolve => setTimeout(resolve, 300000));

  // Get the list of row IDs that did not sync to BigQuery
  const bigqueryRowIDs = await bigquery.bigqueryGetRows(IMPORT_ID);

  // Get the difference count between the two files
  const diffCount = ROW_IDS.length - bigqueryRowIDs.length;

  // Get the specific row IDs that failed to sync so we can figure out why and attempt to solve
  const diffIDs = _difference(ROW_IDS, bigqueryRowIDs);

  console.log('Diff Count', diffCount);
  console.log('Diff IDs ', diffIDs);

  const cols = await csv.readRow(0);

  await new Promise(resolve => {
    eachLimit(
      diffIDs,
      25,
      async id => {
        // Get the problematic row from the CSV again (since we don't store the CSV in memory)
        //const row = await csv.readRow(id, cols);

        // Check Firestore for row ID
        const firestoreRow = await firestore.firestoreGetRow(IMPORT_ID, id);

        if (firestoreRow) {
          console.log(`    Row ${id} - BigQuery Sync failed`);
        } else {
          console.log(`    Row ${id} - Firestore Sync failed`);
        }

        return;
      },
      resolve
    );
  });

  const newToListCounts = await bigquery.bigqueryCalculateNewToList(IMPORT_ID);

  console.log('New to List: ', newToListCounts);
})();
