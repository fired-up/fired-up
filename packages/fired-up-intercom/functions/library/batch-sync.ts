import * as _ from 'lodash';
import * as moment from 'moment';
import { eachLimit } from 'async';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as intercom from 'intercom-client';

import { retryableIntercomTagging } from './retryable-calls';

import statuses from './sync-statuses';

import { logAPIrequest } from '../../../fired-up-core/functions/library/api-logger';

const client = new intercom.Client({
  token: functions.config().intercom.token,
});

const firestore = firebase.firestore();

// You can adjust the schema we send to Intercom here
// Note: Intercom really despises `null` values
const fieldMapping = (person, user) => {
  let name;

  if (user.given_name || user.family_name) {
    name = `${user.given_name || ''} ${user.family_name || ''}`;
    name = name.trim();
  } else if (person.given_name || person.family_name) {
    name = `${person.given_name || ''} ${person.family_name || ''}`;
    name = name.trim();
  }

  const fields: any = {
    user_id: user.id,
    person_id: person.person_id,

    email: person.email_address,

    ...(person.phone_number_number && { phone: person.phone_number_number }),
    ...(name ? { name } : { name: null }),
    ...(person.source_utm_campaign_last && {
      utm_campaign: person.source_utm_campaign_last,
    }),
    ...(person.source_utm_content_last && {
      utm_content: person.source_utm_content_last,
    }),
    ...(person.source_utm_medium_last && {
      utm_medium: person.source_utm_medium_last,
    }),
    ...(person.source_utm_source_last && {
      utm_source: person.source_utm_source_last,
    }),
    ...(person.source_utm_term_last && {
      utm_term: person.source_utm_term_last,
    }),
    ...(person.source_utm_term_last && {
      utm_term: person.source_utm_term_last,
    }),
    custom_attributes: {
      signup_zip: person.postal_code,
      signup_state: person.region,
      consented_to_texts: person.phone_number_sms_capable,
      hygiene_email_validity: person.hygiene_email_validity,
      first_action_at: (new Date().getTime() / 1000) | 0,
      donors_total: user.donors_total || 0,
      donors_donation_total: user.donors_donation_total || 0,
      signups_total: user.signups_total || 0,
      origin_source: person.origin_source,
      volunteer_source: person.volunteer_source,
      is_interested_volunteer: person.is_interested_volunteer,
      volunteer_interests_other: person.volunteer_interests_other,
      volunteer_vpb_availability: person.volunteer_vpb_availability,
    },
  };

  if (person.signup_url_last) {
    fields.referrer = person.signup_url_last;
  } else if (person.signup_url_first) {
    fields.referrer = person.signup_url_first;
  }

  if (user.trainings) {
    _.forOwn(user.trainings, (training, key) => {
      if (user.trainings[key]) {
        fields.custom_attributes[`trained_${key}`] = true;
      }
    });
  }

  return fields;
};

const wait = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const processSync = people => {
  return new Promise(resolve => {
    const batch = firestore.batch();

    eachLimit(
      people,
      8,
      async (person, callback) => {
        try {
          const person_id = person.person_id;

          console.log(`Syncing ${person_id} to Intercom`);

          //delete person.user_id;
          delete person.person_id;

          await client.users.update(person);

          logAPIrequest(
            'Intercom',
            'intercomContactUpdate()',
            'PUT',
            'https://api.intercom.io/users',
            200
          );

          const ref = firestore.collection('people').doc(person_id);

          batch.update(ref, {
            intercom_sync_status: statuses.INTERCOM_SYNC_SUCCESS,
          });
        } catch (error) {
          logAPIrequest(
            'Intercom',
            'intercomContactUpdate()',
            'PUT',
            'https://api.intercom.io/users',
            500
          );

          console.error(error && error.body ? error.body : error);
        }

        await wait(1000);

        return callback();
      },
      async error => {
        if (error) {
          console.error(error);
        }

        await batch.commit();

        return resolve();
      }
    );
  });
};

const peopleBatchSync = (intent?: string) => {
  return new Promise(resolve => {
    console.log('Starting Intercom People Batch Sync');

    const query = firestore
      .collection('people')
      .where('intercom_sync_status', '==', intent === 'update' ? 3 : 2)
      .where('is_interested_volunteer', '==', true)
      .orderBy('updated_at')
      .limit(50);

    let next = query;

    let syncedCount = 0;
    let batchIteration = 0;

    // Loopable main function (so we can work in batches of 1500)
    (async function looper() {
      let fetchCount = 0;

      return next.get().then(async snapshots => {
        if (snapshots.docs.length > 0) {
          const tag_batches = {};
          const batch = firestore.batch();
          const firstDoc = snapshots.docs[0].data().updated_at.toDate();
          const lastDoc = snapshots.docs[snapshots.docs.length - 1]
            .data()
            .updated_at.toDate();

          syncedCount += snapshots.docs.length;

          if (batchIteration === 0) {
            console.log('First queued person update: ', firstDoc);
          } else {
            console.log(
              `Processed ${syncedCount} records - current at ${firstDoc}`
            );
          }

          const people = [];

          fetchCount = snapshots.docs.length;

          console.log(`Fetched ${fetchCount} people`);

          for (const doc of snapshots.docs) {
            // Prepare to read Person object
            const id = doc.id;
            const data = doc.data();
            const person = _.clone(data);
            const createdAt = moment(person.updated_at.toDate().getTime());
            const tenMinutes = moment().subtract(10, 'minutes');
            person.person_id = id;

            // If Person's email is unsubscribed OR hygiene_email_validity is invalid, de-queue the signup for sync
            if (
              person.email_address_status === 'unsubscribed' ||
              person.hygiene_email_validity === 'invalid'
            ) {
              console.log(
                `Skipping ${person.person_id} due to invalid email address`
              );
              const ref = firestore.collection('people').doc(id);

              batch.update(ref, {
                intercom_sync_status: statuses.INTERCOM_SYNC_DISABLED,
              });
            } else {
              const user = await firestore
                .collection('users')
                .where('email_address', '==', person.email_address)
                .get();

              if (Array.isArray(user.docs) && user.docs.length > 0) {
                const filteredPerson = fieldMapping(person, {
                  ...user.docs[0].data(),
                  id: user.docs[0].id,
                });

                people.push(filteredPerson);

                if (person.intercom_interest_tags) {
                  for (const tag of person.intercom_interest_tags) {
                    if (!tag_batches[tag]) {
                      tag_batches[tag] = [];
                    }

                    tag_batches[tag].push({
                      email: person.email_address,
                    });
                  }
                }

                if (person.importer_ids) {
                  for (const id of person.importer_ids) {
                    const yesterday = moment().subtract(24, 'hours');
                    const timestamp = moment(Number(id.replace('csv-', '')));

                    if (timestamp.isAfter(yesterday)) {
                      const tag = `Fired Up Import - ${timestamp.toISOString()}`;

                      if (!tag_batches[tag]) {
                        tag_batches[tag] = [];
                      }

                      tag_batches[tag].push({
                        email: person.email_address,
                      });
                    }
                  }
                }
              } else if (createdAt.isBefore(tenMinutes)) {
                console.log(
                  `${person.person_id} is missing user profile, de-queuing`
                );

                const ref = firestore.collection('people').doc(id);

                batch.update(ref, {
                  intercom_sync_status: statuses.INTERCOM_SYNC_DISABLED,
                });
              } else {
                console.log(
                  `${person.person_id} is missing user profile, retrying in next batch`
                );
              }
            }
          }

          // Process this set of people
          console.log('Process Sync:', people.length);
          await processSync(people);

          // process the tags in single requests per tag
          for (const tag in tag_batches) {
            const batch = tag_batches[tag];

            await retryableIntercomTagging({ name: tag, users: batch });
          }

          // Write updated sync statuses to Firestore
          await batch.commit();

          // Rate limit timing is resolved by how slow firestore is for the above code
          if (lastDoc) {
            next = query.startAfter(lastDoc);

            console.log(`Intercom People Batch Sync - Next Loop - ${lastDoc}`);

            batchIteration++;

            return looper();
          } else {
            console.log('Finished Intercom People Batch Sync');

            return resolve();
          }
        } else {
          console.log(
            `Intercom ${
              intent === 'update' ? 'update' : 'new'
            } people sync is complete.`
          );

          resolve();
        }
      });
    })();
  });
};

export { peopleBatchSync };
