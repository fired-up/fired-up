const PEOPLE_ALGO = 202003;

import * as slug from 'slug';
import * as _ from 'lodash';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';

import validators from './validators';
import statuses from './sync-statuses';

import { FiredUpPeople } from '../typings/people';
import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';

slug.charmap['@'] = '_';
slug.charmap['.'] = '_';

try {
  firebase.initializeApp();
} catch (error) {}

const firestore = firebase.firestore();

const GLOBAL_LIST_ID = functions.config().sendgrid.global_list_id;

const AUTHOR_VALUES = {
  'self-email': 1, // First signup in system
  'self-token': 2, // User who has signed up previously in same browser
  'admin-import': 3, // Admin-imported data
  'admin-auth': 4, // Admin-entered data
  'self-auth': 4, // User proved ownership of email via login and provided info afterwards
};

const PEOPLE_SCHEMA: FiredUpPeople.SchemaDefinitions = [
  // [fieldname, type, userViewable, userEditable, indexPastValues, validator, forceChange]
  ['given_name', 'text', true, true, true],
  ['family_name', 'text', true, true, true],
  ['email_address', 'text', true, true, true],
  ['phone_number', 'text', true, true, false],
  ['address_line1', 'text', true, true, false],
  ['address_line2', 'text', true, true, false],
  ['locality', 'text', true, true, false],
  ['region', 'text', true, true, false],
  ['region_full', 'text', true, true, false],
  ['postal_code', 'text', true, true, false, validators.postal_code],
  ['country', 'text', true, true, false],
  ['latitude', 'number', false, true, false],
  ['longitude', 'number', false, true, false],
  ['employer', 'text', true, true, false],
  ['occupation', 'text', true, true, false],
  ['honorific_prefix', 'text', true, true, false],
  ['honorific_suffix', 'text', true, true, false],

  // No OSDI equivilent
  ['source_first_time', 'date', true, true, false],
  ['source_last_time', 'date', true, true, false],
  ['source_utm_source_first', 'text', true, true, false],
  ['source_utm_medium_first', 'text', true, true, false],
  ['source_utm_campaign_first', 'text', true, true, false],
  ['source_utm_content_first', 'text', true, true, false],
  ['source_utm_term_first', 'text', true, true, false],
  ['source_utm_source_last', 'text', true, true, false],
  ['source_utm_medium_last', 'text', true, true, false],
  ['source_utm_campaign_last', 'text', true, true, false],
  ['source_utm_content_last', 'text', true, true, false],
  ['source_utm_term_last', 'text', true, true, false],
  ['signup_url_first', 'text', true, true, false],
  ['signup_url_last', 'text', true, true, false],
  ['first_action_at', 'text', true, true, false],
  ['origin_source', 'text', true, true, false],
  ['token', 'text', false, true, false],
  ['facebook_id', 'number', false, false, false],
  ['congressional_district', 'text', true, true, false],

  ['phone_number_mobile', 'boolean', false, true, false],
  ['phone_number_sms_capable', 'boolean', false, true, false],
  ['phone_number_number', 'text', false, true, false],
  ['phone_number_extension', 'text', false, true, false],
  ['phone_number_number_type', 'text', false, true, false],
  ['opt_in', 'boolean', false, true, false],
  ['hygiene_email_validity', 'string', false, true, false],
];

/**
 * Generate a config instance from the above PEOPLE_SCHEMA
 * @param field
 */
function getSchemaRule(field): FiredUpPeople.SchemaRule {
  for (const i in PEOPLE_SCHEMA) {
    const row = PEOPLE_SCHEMA[i];

    if (row[0] === field) {
      return {
        type: row[1],
        userViewable: row[2],
        userEditable: row[3],
        indexPastValues: row[4],
        validator: row[5],
        forceChange: row[6],
      };
    }
  }

  return {};
}

/**
 * Use several factors to determine what precidence this submission has to change the final person values
 * Uses author role and validty (if available)
 * @param {string} author Author value (one of self-email, self-token, admin, self-auth)
 * @param {boolean}
 * @returns {number}
 */
function calculateSubmissionCredibility(author: string, validity?: boolean) {
  // Calculate the creditibility of the author value given the global AUTHOR_VALUES
  let credibility = AUTHOR_VALUES[author] || 0;

  // If the validity is false, set credibility to negative value to de-prioritize it entirely
  if (validity === false) {
    credibility = -1;
  }

  return credibility;
}

/**
 * Calculate top-level fields given a Persons metadata (history). All previous data changes are compared,
 * the data change with the highest credibility most recently will be selected
 * @param {object} Person The person object to be modified
 * @returns {object}
 */
export function calculatePrimaryFields(person: FiredUp.Person) {
  const newPerson = {};

  for (const i in person.meta) {
    const field = person.meta[i];

    const sorted = _.sortBy(field.history, [
      item => calculateSubmissionCredibility(item.author, item.valid),
      item => new Date(item.date),
    ]).reverse();

    if (sorted.length > 0) {
      newPerson[i] = sorted[0].value;
    }
  }

  return newPerson;
}

/**
 * Generate Person Schema containing metadata object to start.
 * @returns {object}
 */
function generateSchema(created_at: Date, updated_at?: Date): FiredUp.Person {
  const schema = {
    // If the signup has a created at, use it, otherwise make sure the person gets a created_at of now
    created_at: created_at || firebase.firestore.FieldValue.serverTimestamp(),
    updated_at: updated_at || firebase.firestore.FieldValue.serverTimestamp(),

    email_address: null, // Make typescript happy

    meta: {},
    sendgrid_id: null,
    global_email_list_ids: [GLOBAL_LIST_ID],

    // Allows us to query new People whose functions didn't execute
    sendgrid_sync_status: statuses.SENDGRID_SYNC_FAILED_INITIALLY,
    sendgrid_v3_sync_status: statuses.SENDGRID_SYNC_FAILED_INITIALLY,
    bigquery_sync_status: statuses.BIGQUERY_SYNC_UNKNOWN,
  };

  const addField = name => {
    schema[name] = null;

    schema.meta[name] = {
      history: [],
    };
  };

  for (const i in PEOPLE_SCHEMA) {
    const field = PEOPLE_SCHEMA[i];
    addField(field[0]);
  }

  return schema;
}

function getSubmissionIDs(meta: any): Array<string> {
  const ids = [];

  for (const field of Object.keys(meta)) {
    const details = meta[field];

    for (const row of details.history) {
      if (ids.indexOf(row.source) === -1) {
        ids.push(row.source);
      }
    }
  }

  return ids;
}

/**
 * Generate Form ID and Actions Taken strings for Sendgrid
 * This allows us to create segments based on previously submitted forms and actions taken
 * @param email
 * @returns {object} - returns submitted_forms string like `| form1 | 12345 | abcdefghijklmnop |`, actions taken string like `| signup | p2a |`
 */
async function calculateActionSummaries(
  email_address: string,
  submissionIDs: Array<string>
): Promise<FiredUp.ActionSummaries> {
  try {
    let formIDs: Array<string> = [];
    let formTypes: Array<string> = [];
    let donorTypes: Array<string> = [];
    let importerIDs: Array<string> = [];

    let firstAction: string;
    let firstActionDate: Date = new Date();

    const signupsQuery = firestore
      .collection('signups')
      .where('fields.email_address', '==', email_address)
      .orderBy('created_at', 'desc')
      .limit(36) // Arbitrary total to reduce wasted reads
      .get();

    const donationsQuery = firestore
      .collection('donations')
      .where('fields.email_address', '==', email_address)
      .orderBy('created_at', 'desc')
      .limit(36) // Arbitrary total to reduce wasted reads
      .get();

    const signups = await signupsQuery;
    const donations = await donationsQuery;

    for (const doc of signups.docs) {
      try {
        const data = doc.data();
        const formID: string = data.form_id || data.form;
        const formType: string = data.type;
        const importerID: string = data.importer
          ? data.importer.import_id
          : null;

        if (data.created_at.toDate() < firstActionDate) {
          firstActionDate = data.created_at.toDate();
          firstAction = 'signup';
        }

        if (formID && formIDs.indexOf(formID) === -1) {
          formIDs.push(formID);
        }

        if (formType && formTypes.indexOf(formType) === -1) {
          formTypes.push(formType);
        }

        if (importerID && importerIDs.indexOf(importerID) === -1) {
          importerIDs.push(importerID);
        }
      } catch (error) {}
    }

    for (const doc of donations.docs) {
      try {
        const data = doc.data();
        const donationType = data.type;
        const importerID: string = data.importer
          ? data.importer.import_id
          : null;

        if (data.created_at.toDate() < firstActionDate) {
          firstActionDate = data.created_at.toDate();
          firstAction = 'donation';
        }

        if (donationType && donorTypes.indexOf(donationType) === -1) {
          donorTypes.push(donationType);
        }

        if (importerID && importerIDs.indexOf(importerID) === -1) {
          importerIDs.push(importerID);
        }
      } catch (error) {}
    }

    // Diffing is easier when form IDs are sorted
    if (formIDs.length > 0) {
      formIDs = formIDs.sort();
    }

    if (formTypes.length > 0) {
      formTypes = formTypes.sort();
    }

    return {
      importer_ids: importerIDs || null,
      origin_source: firstAction || null,
      donor_types:
        donorTypes.length > 0 ? `| ${donorTypes.join(' | ')} |` : null,
      submitted_forms: formIDs.length > 0 ? `| ${formIDs.join(' | ')} |` : null,
      actions_taken:
        formTypes.length > 0 ? `| ${formTypes.join(' | ')} |` : null,
    };
  } catch (error) {
    return {
      importer_ids: null,
      donor_types: null,
      origin_source: null,
      actions_taken: null,
      submitted_forms: null,
    };
  }
}

/**
 * Run a validator if it exists, otherwise return null
 * @param {string} input Input to validate
 * @param {function} validator Validation function to execute
 */
function runValidator(input: string, validator?: Function) {
  if (validator) {
    return validator(input);
  }

  return null;
}

/**
 * Change a field on a given Person by appending latest values to metadata
 * @param {object} Person The person object to be modified
 * @param {string} field The name of the field to change
 * @param {string} value The value of the field to change
 * @param {string} type Action type. signup, donation, attendance etc
 * @param {string} [author='self-email'] The author of the change (one of self-email, self-token, admin, self-auth)
 * @param {string} submissionID A Firebase ref of the form where the change originated
 * @param {string} parentID - If action is stored in subcollection, this is the parent collection ID
 * @param {boolean} force Force the change to take precidence, even if value is null
 * @returns {object} person
 */
function changeField(
  person: FiredUp.Person,
  field: string,
  value: string,
  type: string,
  submissionID: string,
  parentID: string,
  author = 'self-email',
  force?: boolean
) {
  const newPerson = _.clone(person);

  newPerson.updated_at = firebase.firestore.FieldValue.serverTimestamp();

  // If the field is part of our schema but not saved to Person, add the field to Person correctly
  if (!newPerson.meta[field] && getSchemaRule(field).userEditable) {
    newPerson.meta[field] = {
      history: [],
    };
  }

  // Only change things if they are different to keep history from being too verbose
  if (
    (value || (force || getSchemaRule(field).forceChange)) &&
    newPerson.meta[field] &&
    newPerson[field] !== value &&
    getSchemaRule(field).userEditable
  ) {
    // Write values to metadata
    newPerson.meta[field].history.push({
      type,
      value,
      source: submissionID,
      parent: parentID || null,
      author: author,
      date: new Date(), // no serverTimestamp in arrays allowed
      valid: runValidator(value, getSchemaRule(field).validator),
    });

    // Write past values
    //if (newPerson.meta[field].indexPastValues) {
    if (getSchemaRule(field).indexPastValues && value) {
      if (
        !newPerson[`index_${field}`] ||
        !Array.isArray(newPerson[`index_${field}`])
      ) {
        newPerson[`index_${field}`] = [];
      }

      if (newPerson[`index_${field}`].indexOf(value) === -1) {
        newPerson[`index_${field}`].push(value);
      }
    }
  } else if (
    newPerson.meta[field] &&
    newPerson[field] === value &&
    getSchemaRule(field).userEditable
  ) {
    // Field unchanged from previous value, no need to log
    /*console.info(
      `${field} - ${value} has not changed since previous edit`
    );*/
  } else {
    // Field not part of Schema or Field value unchanged (Ignoring change)
    /*console.info(
      `${field} is a not part of Person schema or set as a read-only value, ignoring change`
    );*/
  }

  return newPerson;
}

/**
 * Find a Person given an email_address. Resolve if found, reject if not.
 * @param {string} email Email address of submissions
 * @returns {object} person
 */
async function find(email_address): Promise<FiredUpPeople.IdPerson> {
  if (!email_address) {
    throw new Error('find() requires an email address argument');
  }

  const peopleRef = firestore.collection('people');

  // This is written in a seperate function as the logic to match a person via field will be more dynamic in future versions
  async function findPersonByEmail(): Promise<FiredUpPeople.IdPerson> {
    // We return 2 results so we can throw an error if there's more than one person record found
    const emailQuery = peopleRef
      //.where(`index_email_address.${slug(email_address)}`, '==', true)
      .where('email_address', '==', email_address)
      .orderBy('created_at', 'asc')
      .limit(2);

    const snapshot = await emailQuery.get();

    if (snapshot.size > 0) {
      const person = snapshot.docs[0];
      return { person: person.data(), id: person.id };
    }

    if (snapshot.size > 1) {
      console.error('More than one person returned for this email address');
    }

    // Person not found for given email address
    return null;
  }

  return await findPersonByEmail();
}

/**
 * Create a new Person
 * @param {object} fields Fields submitted via user. Email is a required parameter
 * @param {string} type Action type. signup, donation, attendance etc
 * @param {string} submissionID Firebase ID of the form submission
 * @param {string} parentID - If action is stored in subcollection, this is the parent collection ID*
 * @param {string} token Persistent token generated in users browsers
 * @returns {object} person
 */
async function create(
  signup: FiredUp.Signup,
  type: string,
  submissionID: string,
  parentID?: string,
  token?: string
): Promise<FiredUpPeople.IdPerson> {
  const metaFields: any = {};

  // Generate skeleton data needed for new person
  let person = generateSchema(signup.created_at.toDate());

  person.people_algo = PEOPLE_ALGO;

  // Turn off Sendgrid sync if the signup is clearly spam
  if (signup.hygiene_email_validity === 'invalid') {
    person.sendgrid_sync_status = statuses.SENDGRID_SYNC_DISABLED;
    person.sendgrid_v3_sync_status = statuses.SENDGRID_SYNC_DISABLED;
  }

  // TODO: BULK SET
  metaFields.first_action_at = signup.created_at.toDate();
  metaFields.signup_url_first = signup.url || null;

  // Set first UTM values for signup
  if (signup.utm && Object.keys(signup.utm).length > 0) {
    metaFields.source_utm_source_first = signup.utm.source || null;
    metaFields.source_utm_medium_first = signup.utm.medium || null;
    metaFields.source_utm_campaign_first =
      signup.utm.name || signup.utm.campaign || null;
    metaFields.source_utm_content_first = signup.utm.content || null;
    metaFields.source_utm_term_first = signup.utm.term || null;
  }

  // Set user-submitted fields for signup
  for (const i in signup.fields) {
    person = changeField(
      person,
      i,
      signup.fields[i],
      type,
      submissionID,
      parentID,
      'self-email'
    );
  }

  // Set meta fields related to signup
  for (const i in metaFields) {
    person = changeField(
      person,
      i,
      metaFields[i],
      type,
      submissionID,
      parentID,
      'self-email'
    );
  }

  let newPerson = _.merge(person, calculatePrimaryFields(person));

  const submissionIDs = [...getSubmissionIDs(newPerson.meta), submissionID];

  // Calculate submitted form IDs based on meta
  const {
    importer_ids,
    donor_types,
    actions_taken,
    origin_source,
    submitted_forms,
  } = await calculateActionSummaries(newPerson.email_address, submissionIDs);

  newPerson.importer_ids = importer_ids;
  newPerson.donor_types = donor_types;
  newPerson.origin_source = origin_source;
  newPerson.actions_taken = actions_taken;
  newPerson.submitted_forms = submitted_forms;

  if (newPerson.opt_in === false) {
    newPerson.sendgrid_sync_status = statuses.SENDGRID_SYNC_DISABLED;
    newPerson.sendgrid_v3_sync_status = statuses.SENDGRID_SYNC_DISABLED;
  }

  // Get Firebase user ID
  try {
    newPerson.firebase_user_id = null;
    newPerson.intercom_sync_status = statuses.INTERCOM_SYNC_DISABLED;

    const firebaseUser = await firebase
      .auth()
      .getUserByEmail(person.email_address);

    if (firebaseUser) {
      newPerson.firebase_user_id = firebaseUser.uid;
      newPerson.intercom_sync_status = statuses.INTERCOM_SYNC_QUEUED_INITIALLY;
    }
  } catch (error) {}

  try {
    const ref = await firestore.collection('people').add(newPerson);
    return { id: ref.id, person: newPerson };
  } catch (error) {
    console.error(error);
    console.error(JSON.stringify(newPerson.meta));
    delete newPerson.meta;
    console.error(newPerson);

    throw error;
  }
}

/**
 * Update an existing Person
 * @param {object} person Internal data structure containing person ID, person object, and flushParameter option
 * @param {object} fields Fields submitted via user. Email is a required parameter
 * @param {string} type Action type. signup, donation, attendance etc
 * @param {string} submissionID Firebase ID of the form submission
 * @param {string} parentID - If action is stored in subcollection, this is the parent collection ID
 * @param {string} token Persistent token generated in users browsers
 * @returns {object} person
 */
async function update(
  { id, person, flushToken }: FiredUpPeople.IdPerson,
  signup: FiredUp.Signup,
  type: string,
  submissionID: string,
  parentID?: string,
  token?: string
): Promise<FiredUpPeople.IdPerson> {
  const metaFields: any = {};
  let newPerson = _.clone(person);

  newPerson.people_algo = PEOPLE_ALGO;

  // If a token matched but email was for an existing user that wasn't
  // associated with the matched one, flush the token to prevent duplicate data
  if (flushToken) {
    signup.fields.token = null;
  }

  if (
    !newPerson.global_email_list_ids ||
    newPerson.global_email_list_ids.length === 0
  ) {
    newPerson.global_email_list_ids = [GLOBAL_LIST_ID];
  }

  if (!newPerson.first_action_at) {
    // Set first action time to person creation time
    metaFields.first_action_at = person.created_at.toDate();
  }

  if (!newPerson.signup_url_first) {
    metaFields.signup_url_first = signup.url || null;
  }

  // Handle imported data that is created before the person object
  if (
    newPerson.first_action_at &&
    signup.created_at.toDate() < newPerson.first_action_at.toDate()
  ) {
    // Set first action time if this signup was created before
    metaFields.first_action_at = signup.created_at.toDate();

    // Set signup url
    if (signup.url) {
      metaFields.signup_url_first = signup.url || null;
    }

    // Set first UTM values for signup
    if (signup.utm && Object.keys(signup.utm).length > 0) {
      metaFields.source_utm_source_first = signup.utm.source || null;
      metaFields.source_utm_medium_first = signup.utm.medium || null;
      metaFields.source_utm_campaign_first =
        signup.utm.name || signup.utm.campaign || null;
      metaFields.source_utm_content_first = signup.utm.content || null;
      metaFields.source_utm_term_first = signup.utm.term || null;
    }
  }

  // Set signup url
  if (signup.url) {
    metaFields.signup_url_last = signup.url || null;
  }

  // Set last UTM values for signup
  if (signup.utm && Object.keys(signup.utm).length > 0) {
    metaFields.source_utm_source_last = signup.utm.source || null;
    metaFields.source_utm_medium_last = signup.utm.medium || null;
    metaFields.source_utm_campaign_last =
      signup.utm.name || signup.utm.campaign || null;
    metaFields.source_utm_content_last = signup.utm.content || null;
    metaFields.source_utm_term_last = signup.utm.term || null;
  }

  // Set user-submitted fields for signup
  for (const i in signup.fields) {
    let value = signup.fields[i];

    // If the data type for this field is an array and it exists on the person already, use _.union to merge
    // and get unique items for the array
    if (Array.isArray(signup.fields[i]) && Array.isArray(person[i])) {
      value = _.union(person[i], signup.fields[i]);
    } else if (Array.isArray(signup.fields[i])) {
      value = signup.fields[i];
    }

    newPerson = changeField(
      newPerson,
      i,
      value,
      type,
      submissionID,
      parentID,
      'self-email'
    );
  }

  // Set meta fields related to signup
  for (const i in metaFields) {
    newPerson = changeField(
      newPerson,
      i,
      metaFields[i],
      type,
      submissionID,
      parentID,
      'self-email'
    );
  }

  if (signup.hygiene_email_validity === 'invalid') {
    // Turn off Sendgrid sync if the signup is clearly spam
    newPerson.sendgrid_sync_status = statuses.SENDGRID_SYNC_DISABLED;
    newPerson.sendgrid_v3_sync_status = statuses.SENDGRID_SYNC_DISABLED;
  } else {
    // Put person into queue for sendgrid updates
    newPerson.sendgrid_sync_status = statuses.SENDGRID_SYNC_FAILED_INITIALLY;
    newPerson.sendgrid_v3_sync_status = statuses.SENDGRID_SYNC_FAILED_INITIALLY;
  }

  // Calculate top-level fields based on meta
  newPerson = _.merge(newPerson, calculatePrimaryFields(newPerson));

  const submissionIDs = [...getSubmissionIDs(newPerson.meta), submissionID];

  // Calculate submitted form IDs based on meta
  const {
    importer_ids,
    donor_types,
    origin_source,
    actions_taken,
    submitted_forms,
  } = await calculateActionSummaries(newPerson.email_address, submissionIDs);

  newPerson.importer_ids = importer_ids;
  newPerson.donor_types = donor_types;
  newPerson.actions_taken = actions_taken;
  newPerson.origin_source = origin_source;
  newPerson.submitted_forms = submitted_forms;

  try {
    newPerson.firebase_user_id = null;
    newPerson.intercom_sync_status = statuses.INTERCOM_SYNC_DISABLED;

    const firebaseUser = await firebase
      .auth()
      .getUserByEmail(person.email_address);

    if (firebaseUser) {
      newPerson.firebase_user_id = firebaseUser.uid;
      newPerson.intercom_sync_status = statuses.INTERCOM_SYNC_QUEUED_UPDATE;
    }
  } catch (error) {}

  try {
    const ref = await firestore
      .collection('people')
      .doc(id)
      .set(newPerson);

    return { id, person: newPerson };
  } catch (error) {
    console.error(JSON.stringify(newPerson.meta));

    delete newPerson.meta;

    console.error(newPerson);

    throw error;
  }
}

/**
 * Find and Update a Person given fields, or create a new one
 * @param {string} token - Persistent token generated in users browsers
 * @param {string} email - A user's email address
 * @param {object} signup
 * @param {string} type Action type. signup, donation, attendance etc
 * @param {string} submissionID - Firebase ID of the form submission
 * @param {string} parentID - If action is stored in subcollection, this is the parent collection ID
 * @returns {object} instance of FiredUp.Person with document ID
 */
async function findUpdateOrCreate(
  token: string,
  email_address: string,
  signup: FiredUp.Signup,
  type: string,
  submissionID: string,
  parentID?: string
): Promise<FiredUpPeople.IdPerson> {
  console.log(
    `People: Running Find, Update, or Create - ${type}: ${submissionID}`
  );

  // Reduce duplicates by accepting different cases as same email
  if (email_address) {
    email_address = email_address.toLowerCase();
  }

  // Expand state names into full strings
  /*if (_.get(stateAbbrs, `${signup.fields.region}`, null)) {
    signup.fields['region_full'] = stateAbbrs[signup.fields.region];
  }*/

  console.log(`People: Finding - ${type}: ${submissionID}`);

  try {
    const foundPerson = await find(email_address);

    if (foundPerson) {
      console.log(`People: Updating - ${type}: ${submissionID}`);

      const updatedPerson = await update(
        foundPerson,
        signup,
        type,
        submissionID,
        parentID,
        token
      );

      return updatedPerson;
    } else {
      console.log(`People: Creating - ${type}: ${submissionID}`);

      const person = await create(signup, type, submissionID, parentID, token);

      return person;
    }
  } catch (error) {
    // Person upsert failed

    throw error;
  }
}

export default {
  find,
  create,
  update,
  changeField,
  generateSchema,
  getSubmissionIDs,
  findUpdateOrCreate,
  calculatePrimaryFields,
  calculateActionSummaries,
};
