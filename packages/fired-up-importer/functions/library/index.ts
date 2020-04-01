import {
  chunk as _chunk,
  forEach as _forEach,
  get as _get,
  map as _map,
  throttle as _throttle,
} from 'lodash';
import { Storage } from '@google-cloud/storage';
import * as admin from 'firebase-admin';

const csvParse = require('csv-parse/lib/sync');
const csvStringify = require('csv-stringify/lib/sync');

const colsUnformatted = require('./cols.js');

const projectId = process.env.GCLOUD_PROJECT || 'firedup-dev';
const storage = new Storage({
  projectId,
});

/**
 * Updates an import document's completion percentage as the import runs
 * @param docId firestore import document id for updating
 * @param percent_complete floating point number 0-1 denoting % of status complete
 */
function updateImportProgress(docId, percentComplete) {
  try {
    admin
      .firestore()
      .collection('imports')
      .doc(docId)
      .update({
        percent_complete: percentComplete * 100,
      });
  } catch (err) {
    console.error(err);
  }
}

/**
 * After processing a CSV, a CSV of errors gets uploaded
 * @todo: for the sake of storage, maybe this should only be stored for 7 days?
 * @param docId - import docId that error report location will be attached to
 * @param bucket - bucket for upload
 * @param errors - Array of error fields to be coerced into a CSV
 * @returns - path to the error document
 */
async function uploadErrorReport(docId, bucket, errors): Promise<string> {
  try {
    if (!errors.length) {
      return null;
    }

    const out = csvStringify(errors, {
      header: true,
    });

    const filename = `imports/invalid/${docId}-invalid.csv`;
    await storage
      .bucket(bucket)
      .file(filename)
      .save(out);

    return filename;
  } catch (err) {
    console.error(`Importer error for doc ${docId}`);
    console.error(err);
  }
}

export async function processImport(
  snapshot?: FirebaseFirestore.DocumentSnapshot
) {
  try {
    const data = snapshot.data();
    if (!data.file_name) {
      throw new Error(`Invalid, no file_name specified - ${snapshot.id}`);
    }

    const res = await storage
      .bucket(data.bucket)
      .file(data.file_name)
      .download();

    if (!res) {
      console.error(`Unable to download - ${snapshot.id}`);
      throw new Error(`Invalid - ${snapshot.id}`);
    }

    // Initialize parser
    const records = csvParse(res[0], {
      columns: true,
      skip_empty_lines: true,
    });

    // Provide faster access to cols without using _find
    const cols = {};
    _forEach(colsUnformatted, col => {
      cols[col.name] = col;
    });

    const INVALID_ROWS = [];

    // Build UTM params
    const utm = {
      content: _get(data, 'utm.utm_content', null),
      medium: _get(data, 'utm.utm_medium', null),
      source: _get(data, 'utm.utm_source', null),
      term: _get(data, 'utm.utm_term', null),
      name:
        _get(data, 'utm.utm_name', null) ||
        _get(data, 'utm.utm_campaign', null),
    };

    const chunks = _chunk(records, 500);
    const numChunks = chunks.length;
    let idx = 0;

    for await (const chunk of chunks) {
      const batch = admin.firestore().batch();

      _forEach(chunk, (record: object) => {
        const signup = {
          fields: {},
          form_id: 'T2gLgcxdH63dIsNftzWh',
          type: 'signup',
          url: null,
          utm,
          importer: {
            filename: data.file_name,
            import_id: snapshot.id,
            // row_id: idx,
          },
        };

        let isRowValid = true;

        // Apply and validate all mapped fields
        for (const field of data.map) {
          // safely grab corresponding field from current record
          const matchedColData = _get(record, field.match, null);
          let isColumnValid = true;

          if (field.name === 'email_address' && !matchedColData) {
            isRowValid = false;
          }

          // If there's no match here, there's nothing we can load for this column
          else if (!matchedColData) {
            continue;
          }

          // Otherwise, handle validation for this field, if necessary
          else if (cols[field.name].validation) {
            isColumnValid = cols[field.name].validation(matchedColData);

            if (!isColumnValid) {
              isRowValid = false;
            }
          }

          if (isRowValid && field.name === 'created_at') {
            signup['created_at'] = admin.firestore.Timestamp.fromDate(
              new Date(matchedColData)
            );
          }

          signup.fields[field.name] = _get(record, field.match, null);
        }

        // Add custom tasks. For now we can have both without issue, we just overwrite
        if (_get(data, 'settings.create_users', null)) {
          signup['fired_up_custom_tasks'] = ['create_firebase_user'];
        }

        if (_get(data, 'settings.create_volunteers', null)) {
          signup['fired_up_custom_tasks'] = [
            'create_firebase_user',
            'interested_volunteer',
          ];
        }

        // Skip syncing this row
        if (!isRowValid) {
          INVALID_ROWS.push({
            ...record,
          });
        } else {
          const batchRef = admin
            .firestore()
            .collection('signups')
            .doc();
          batch.set(batchRef, signup);
        }
      });

      idx++;
      updateImportProgress(snapshot.id, idx / numChunks);

      try {
        await batch.commit();
      } catch (err) {
        console.error(err);
      }
    }

    const errorReportDocLocation = await uploadErrorReport(
      snapshot.id,
      data.bucket,
      INVALID_ROWS
    );

    await admin
      .firestore()
      .collection('imports')
      .doc(snapshot.id)
      .update({
        completed: admin.firestore.FieldValue.serverTimestamp(),
        percent_complete: 100,
        ...(errorReportDocLocation && {
          error_doc: errorReportDocLocation,
        }),
        ...(errorReportDocLocation && {
          invalid_records: INVALID_ROWS.length,
        }),
      });
  } catch (err) {
    console.error(err);
  }
}
