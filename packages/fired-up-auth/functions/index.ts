import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  get as _get,
  reduce as _reduce,
  isEqual as _isEqual,
  difference as _difference,
} from 'lodash';

import statuses from '../../fired-up-bigquery/functions/library/sync-statuses';
import {
  FirebaseUserRow,
  writeFirebaseUser,
} from '../../fired-up-bigquery/functions/library/bigquery';

import { createDashboardUser, ensureDashboardUser } from './library/auth';

import people from '../../fired-up-people/functions/library/people';

try {
  firebase.initializeApp();
} catch (error) {}

const firestore = firebase.firestore();

export const firedupAuthBigqueryInitialSync = functions.auth
  .user()
  .onCreate(async user => {
    await writeFirebaseUser({
      firebase_id: user.uid,
      email_address: user.email,
      ngp_action_id: user.ngp_action_id,
      last_login_at: firebase.firestore.FieldValue.serverTimestamp(),
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });

export const firedupAuthBigqueryUpdateSync = functions.firestore
  .document('users/{userId}')
  .onUpdate(async change => {
    const ignoreChanges = ['created_at', 'updated_at', 'bigquery_sync_status'];

    // Check which keys changed, if the only key to change is in the above list, ignore writing change to BigQuery
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
    const user: FirebaseUserRow = change.after.data();

    if (finalChanges.length > 0) {
      console.log(`Started firedupAuthBigqueryUpdateSync - ${id}`);

      let bigquery_sync_status = statuses.BIGQUERY_SYNC_FAILURE;
      let trainings = [];

      for (const key in user.trainings) {
        trainings.push({
          key,
          // When the Precinct Captain training launched, the trainings now only sets in BigQuery sets
          // if the value is true and a timestamp is added. In the previous version, a training value could be false.
          value:
            typeof user.trainings[key] === 'boolean'
              ? user.trainings[key]
              : true,
          timestamp:
            typeof user.trainings[key] !== 'boolean' &&
            user.trainings[key].toDate(),
        });
      }

      try {
        const bigQueryResponse = await writeFirebaseUser({
          ...user,
          trainings,
          firebase_id: id,
          avatar_path: user.avatarPath,
        });

        bigquery_sync_status =
          _get(bigQueryResponse, 'success') === true
            ? statuses.BIGQUERY_SYNC_SUCCESS
            : statuses.BIGQUERY_SYNC_FAILURE;

        console.log(`Finished firedupAuthBigqueryUpdateSync - ${id}`);
      } catch (error) {
        console.error(`Error firedupAuthBigqueryUpdateSync - ${id}`, error);
      }

      await firestore
        .collection('users')
        .doc(id)
        .update({
          bigquery_sync_status,
        });
    } else {
      console.log(`Skipping unneeded write for ${id}`);
    }
  });

export const createUserFromOkta = functions.https.onRequest(
  async (req, res) => {
    try {
      const authKey = functions.config().okta.auth_key;
      if (!req.headers.authorization || req.headers.authorization !== authKey) {
        return res.status(401).send('Unauthorized');
      }

      if (req.headers['x-okta-verification-challenge']) {
        return res.json({
          verification: req.headers['x-okta-verification-challenge'],
        });
      }

      const events = req.body.data.events;

      events.forEach(event => {
        if (
          event.eventType === 'user.lifecycle.create' &&
          event.outcome.result === 'SUCCESS'
        ) {
          const targets = event.target;

          targets.forEach(async target => {
            if (target.type === 'User') {
              const [firstName, lastName] = target.displayName.split(' ');

              const userSignupData = {
                fired_up_custom_tasks: ['create_firebase_user'],
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                url: null,
                fields: {
                  email_address: target.alternateId,
                  family_name: lastName,
                  given_name: firstName,
                },
              };

              const signup = await firestore
                .collection('signups')
                .add(userSignupData);

              console.log('Signup created with ID: ', signup.id);

              res.sendStatus(200);
            }
          });
        }
      });
    } catch (error) {
      console.log(error);
      res.sendStatus(400);
    }
  }
);
