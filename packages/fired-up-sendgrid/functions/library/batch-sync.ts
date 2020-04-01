import * as _ from 'lodash';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as client from '@sendgrid/client';
import statuses from './sync-statuses';
import { logAPIrequest } from 'fired-up-core/functions/library/api-logger';

const firestore = firebase.firestore();
const SENDGRID_KEY = functions.config().sendgrid.key;

const FIELD_MAPPING = {
  first_name: 'given_name',
  last_name: 'family_name',
  email: 'email_address',
  address_line_1: 'address_line1',
  address_line_2: 'address_line2',
  city: 'locality',
  country: 'country',
  postal_code: 'postal_code',
  state_province_region: 'region',
  phone_number: 'phone_number',

  person_id: 'person_id',
  global_email_list_ids: 'global_email_list_ids',
};

const CUSTOM_FIELDS = [
  'person_created_at',
  'person_updated_at',
  'person_id',
  'firebase_user_id',
  'honorific_suffix',
  'honorific_prefix',
  'employer',
  'occupation',
  'hygiene_email_validity',
  'submitted_forms',
  'actions_taken',
  'welcome_status',
  'donor_types',
  'origin_source',

];

/**
 * Set the sendgrid synced status of every synced person
 * @param people Array of fired Up People
 */
async function setPeopleSyncedSyncStatus(people) {
  try {
    const uniqueIDs = [];
    const batch1 = firestore.batch();
    const batch2 = firestore.batch();

    for (const i in people) {
      const person = people[i];

      const ref = firestore.collection('people').doc(person.person_id);

      const update = {
        //sendgrid_sync_status: person.synced ? statuses.SENDGRID_SYNC_SUCCESS : statuses.SENDGRID_SYNC_DISABLED
        sendgrid_sync_status: person.synced
          ? statuses.SENDGRID_SYNC_SUCCESS
          : statuses.SENDGRID_SYNC_DISABLED,
      };

      if (uniqueIDs.indexOf(person.person_id) === -1) {
        if (Number(i) < 500) {
          batch1.update(ref, update);
        } else {
          batch2.update(ref, update);
        }
      }

      uniqueIDs.push(person.personID);
    }

    await batch1.commit();
    await batch2.commit();
  } catch (error) {
    console.error('Error updating synced statuses', error);
  }

  return;
}

/**
 * Convert a Fired Up Person to a Sendgrid Contact object
 * @param firedUpPerson
 * @param fieldIDs Object keyed by Sendgrid Custom Field Keys, values are field names
 */
function convertFiredUpPersonToSendgridContact(firedUpPerson, fieldIDs) {
  const sendgridContact = {
    synced: true, // A contact is considered successfully synced unless an error occurs later
    custom_fields: {},
  };

  // Set the base profile fields for the contact (name and address)
  for (const field in FIELD_MAPPING) {
    sendgridContact[field] = _.get(firedUpPerson, FIELD_MAPPING[field], null);
  }

  // timestamps need to be renamed
  firedUpPerson.person_created_at = firedUpPerson.created_at;
  firedUpPerson.person_updated_at = firedUpPerson.updated_at;

  const keys = Object.keys(firedUpPerson);

  // Save all the fields above
  for (const key of keys) {
    const value = firedUpPerson[key];
    const fieldID = fieldIDs[key];

    // Value must be defined and not null
    if (
      CUSTOM_FIELDS.indexOf(key) !== -1 &&
      typeof value !== 'undefined' &&
      value !== null
    ) {
      if (typeof value === 'object' && typeof value.toDate === 'function') {
        sendgridContact.custom_fields[fieldID] = value.toDate().toISOString();
      } else if (typeof value === 'boolean') {
        sendgridContact.custom_fields[fieldID] = value ? 'true' : 'false';
      } else {
        sendgridContact.custom_fields[fieldID] = value;
      }
    }
  }

  // Lat/Lng need to be tacked in seperately because we need to cast them into numbers
  sendgridContact.custom_fields[fieldIDs.latitude] =
    Number(firedUpPerson.latitude) || null;
  sendgridContact.custom_fields[fieldIDs.longitude] =
    Number(firedUpPerson.longitude) || null;

  return sendgridContact;
}

/**
 * You can't set field names in the custom_fields object sent to Sendgrid contacts sync
 * This grabs the actual (internal) field IDs that sendgrid uses so we can key custom_fields
 */
async function getSendgridCustomFieldIDs() {
  const fields = {};

  try {
    // Make Sendgrid API request
    const [response, body] = await client.request({
      method: 'GET',
      url: '/v3/marketing/field_definitions',
      forever: true,
    });

    // ( component, context, method, resource, status, initator )
    logAPIrequest(
      'Sendgrid',
      'getSendgridCustomFieldIDs()',
      'GET',
      'https://api.sendgrid.com/v3/marketing/field_definitions',
      response.statusCode
    );

    for (const field of body.custom_fields) {
      fields[field.name] = field.id;
    }

    return fields;
  } catch (error) {
    console.error('getSendgridCustomFieldIDs()', error.response.body);

    return fields;
  }
}

/**
 * Break the array of people to upsert to Sendgrid into arrays based on their list IDs
 * Sync the people up to sendgrid then process the results
 * @param people array of Fired Up People
 */
async function processSendgridSync(people) {
  return new Promise(async (resolve, reject) => {
    // Create a dictionary of lists to sync
    const lists = { default: [] };

    // For each persons lists, copy the person into each list array
    // People need to be upserted per-list, and more than once if they have multiple list IDs
    // If no list ids, save to the "default" list ID which will be handled specially later
    for (const person of people) {
      const listIDs = person.global_email_list_ids;

      if (!Array.isArray(listIDs) || listIDs.length === 0) {
        lists.default.push(person);
      } else {
        for (const listID of listIDs) {
          if (!lists[listID]) {
            lists[listID] = [];
          }

          lists[listID].push(person);
        }
      }
    }

    console.log(
      `Syncing ${people.length} people to ${Object.keys(lists).length} lists`
    );

    for (const listID in lists) {
      const list = lists[listID];

      try {
        const data: any = {
          contacts: list,
        };

        if (listID !== 'default') {
          data.list_ids = [listID];
        }

        if (list.length > 0) {
          console.log(`Syncing ${list.length} contacts to list ${listID}`);

          // Make Sendgrid API request
          const [response, body] = await client.request({
            body: data,
            forever: true,
            method: 'PUT',
            url: '/v3/marketing/contacts',
          });

          // ( component, context, method, resource, status, initator )
          logAPIrequest(
            'Sendgrid',
            'processSendgridSync()',
            'PUT',
            'https://api.sendgrid.com/v3/marketing/contacts',
            response.statusCode
          );

          await setPeopleSyncedSyncStatus(people);
        }
      } catch (error) {
        console.error('Error Sendgrid People Batch Sync');

        if (error && error.response) {
          logAPIrequest(
            'Sendgrid',
            'processSendgridSync()',
            'PUT',
            'https://api.sendgrid.com/v3/marketing/contacts',
            error.response.statusCode
          );

          if (error.response.body.errors) {
            for (const row of error.response.body.errors) {
              try {
                const indexRegex = /.*\[(\d*)\]\..*/;
                const matches = row.field.match(indexRegex);
                const index = Number(matches[1]);
                list[index].synced = false;
              } catch (error) {
                console.error(row);
              }
            }
          }

          await setPeopleSyncedSyncStatus(people);
        }

        console.error(
          error.response.body ? error.response.body.errors : error.message
        );
      }
    }

    resolve();
  });
}

/**
 * People Batch Sync, Sendgrid API. Sync 1500 recently created or updated contacts at a time to Sendgrid contacts
 * @param syncUpdatedPeople {boolean} if true, grabs recently updated people instead of new people. This allows new people to be prioritized for syncing to Sendgrid
 */
export async function peopleBatchSync(syncUpdatedPeople?: boolean) {
  console.log('Starting Sendgrid People Batch Sync');

  client.setApiKey(SENDGRID_KEY);

  const query = firestore
    .collection('people')
    //.where('sendgrid_sync_status', '==', syncUpdatedPeople ? 3 : 2)
    .where('sendgrid_sync_status', '==', syncUpdatedPeople ? 3 : 2)
    .orderBy('updated_at')
    .limit(500);

  let next = query;
  let batchIteration = 0;
  let syncCount = 0;

  const fieldIDs = await getSendgridCustomFieldIDs();

  // Loopable main function (so we can work in batches of 1500)
  const looper = async function looper() {
    let fetchCount = 0;
    let unsubscribedCount = 0;

    return next.get().then(async snapshots => {
      if (snapshots.docs.length > 0) {
        const lastDoc = snapshots.docs[snapshots.docs.length - 1].data()
          .updated_at;

        syncCount += snapshots.docs.length;

        if (batchIteration === 0) {
          console.log(
            'Oldest queued person update: ',
            lastDoc.toDate().toISOString()
          );
        } else {
          console.log(`Processed ${syncCount} records`);
        }

        const people = [];
        const unsubscribed = [];
        const unsubscribedBatch1 = firestore.batch();
        const unsubscribedBatch2 = firestore.batch();

        fetchCount = snapshots.docs.length;

        for (const doc of snapshots.docs) {
          // Prepare to read Person object
          const id = doc.id;
          const data = doc.data();
          const person = _.clone(data);
          person.person_id = id;

          // If Person's email is unsubscribed OR hygiene_email_validity is invalid, de-queue the signup for sync
          if (
            person.email_address_status === 'unsubscribed' ||
            (person.hygiene_email_validity &&
              person.hygiene_email_validity === 'invalid')
          ) {
            unsubscribedCount++;

            unsubscribed.push(id);

            const ref = firestore.collection('people').doc(id);

            const update = {
              //sendgrid_sync_status: statuses.SENDGRID_SYNC_DISABLED,
              sendgrid_sync_status: statuses.SENDGRID_SYNC_DISABLED,
            };

            // Split into two batches to meet Firestore's batch limit
            if (unsubscribed.length > 500) {
              unsubscribedBatch1.update(ref, update);
            } else {
              unsubscribedBatch2.update(ref, update);
            }
          } else {
            // If a person should be synced, convert their person record to a sendgrid contact
            people.push(
              convertFiredUpPersonToSendgridContact(person, fieldIDs)
            );
          }
        }

        await processSendgridSync(people);

        try {
          await unsubscribedBatch1.commit();
          await unsubscribedBatch2.commit();
        } catch (error) {
          console.log('Batch commit error: ', error);
        }

        // Rate limit timing is resolved by how slow firestore is for the above code
        if (lastDoc) {
          next = query.startAfter(lastDoc);

          console.log('Sendgrid People Batch Sync - Next Loop');

          batchIteration++;

          return looper();
        } else {
          console.log('Finished Sendgrid People Batch Sync');

          return true;
        }
      } else {
        console.log(
          `Sendgrid ${
            syncUpdatedPeople ? 'update' : 'new'
          } people sync is complete.`
        );
      }
    });
  };

  return looper();
}

export default {
  peopleBatchSync,
};
