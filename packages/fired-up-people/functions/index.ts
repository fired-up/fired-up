import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  get as _get,
  reduce as _reduce,
  isEqual as _isEqual,
  difference as _difference,
} from 'lodash';

import statuses from '../../fired-up-bigquery/functions/library/sync-statuses';
import { writeFiredUpPerson } from '../../fired-up-bigquery/functions/library/bigquery';

import { upsertPersonSimple } from './library/people-simple';

try {
  firebase.initializeApp();
} catch (error) {}

const firestore = firebase.firestore();

export const personCreate = functions.firestore
  .document('people/{personId}')
  .onCreate(async snap => {
    const id = snap.id;
    const person = snap.data();
    console.log(`Started personCreate - ${id}`);

    try {
      const bigQueryResponse = await writeFiredUpPerson({
        ...person,
        person_id: id,
      });

      const bigquery_sync_status =
        _get(bigQueryResponse, 'success') === true
          ? statuses.BIGQUERY_SYNC_SUCCESS
          : statuses.BIGQUERY_SYNC_FAILURE;

      console.log(
        `bigQueryResponse: ${JSON.stringify(
          bigQueryResponse
        )}, bigquery_sync_status: ${bigquery_sync_status} - ${id}`
      );

      // Write back bigquery sync status
      await firestore
        .collection('people')
        .doc(id)
        .set({ bigquery_sync_status }, { merge: true });

      console.log(`Finished personCreate - ${id}`);

      // Update realtime counter
      try {
        const counterRef = firestore.collection('counters').doc('home-signup');

        counterRef.get().then(doc => {
          if (!doc.exists) {
            counterRef.set({ total: 1 }).then(() => {
              console.log('Counter Initalized');
            });
          } else {
            firestore
              .runTransaction(transaction => {
                // This code may get re-run multiple times if there are conflicts.
                return transaction.get(counterRef).then(counter => {
                  const previous = counter.data().total || 0;
                  transaction.update(counterRef, {
                    total: previous + 1,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                  });
                });
              })
              .then(() => {
                console.log('Counter Updated');
              })
              .catch(error => {
                console.log('Counter Failed to Update:', error);
              });
          }
        });
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      const bigquery_sync_status = statuses.BIGQUERY_SYNC_FAILURE;

      await firestore
        .collection('people')
        .doc(id)
        .set({ bigquery_sync_status }, { merge: true });

      console.log(`Error personCreate - ${id}`, error);
    }

    // Write person_simple record for searching
    await upsertPersonSimple(id, person);

    return;
  });

export const personUpdate = functions.firestore
  .document('people/{personId}')
  .onUpdate(async change => {
    const ignoreChanges = [
      'created_at',
      'updated_at',
      'bigquery_sync_status',
      'meta',
    ];
    const after = change.after.data();
    const before = change.before.data();
    const differenceKeys = _reduce(
      before,
      (result, value, key) =>
        _isEqual(value, after[key]) ? result : result.concat(key),
      []
    );
    const finalChanges = _difference(differenceKeys, ignoreChanges);

    const id = change.after.id;
    const person = change.after.data();

    if (finalChanges.length > 0) {
      console.log(`Started personUpdate - ${id}`);

      try {
        const bigQueryResponse = await writeFiredUpPerson({
          ...person,
          person_id: id,
        });

        const bigquery_sync_status =
          _get(bigQueryResponse, 'success') === true
            ? statuses.BIGQUERY_SYNC_SUCCESS
            : statuses.BIGQUERY_SYNC_FAILURE;

        console.log(
          `bigQueryResponse: ${JSON.stringify(
            bigQueryResponse
          )}, bigquery_sync_status: ${bigquery_sync_status} - ${id}`
        );

        // Write back bigquery sync status
        await firestore
          .collection('people')
          .doc(id)
          .set({ bigquery_sync_status }, { merge: true });

        console.log(`Finished personUpdate - ${id}`);
      } catch (error) {
        const bigquery_sync_status = statuses.BIGQUERY_SYNC_FAILURE;

        await firestore
          .collection('people')
          .doc(id)
          .set({ bigquery_sync_status }, { merge: true });

        console.error(`Error personUpdate - ${id}`, error);
      }
    } else {
      console.log(`Skipping unneeded write for ${id}`);
    }

    // Write person_simple record for searching
    await upsertPersonSimple(id, person);

    return;
  });
