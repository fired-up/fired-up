import _difference from 'lodash/difference';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';

try {
  firebase.initializeApp();
} catch (error) {}

import { writeToTable } from '../../fired-up-bigquery/functions/library/bigquery';
import statuses from '../../fired-up-bigquery/functions/library/sync-statuses';

const CONFIG = require('../config.json');

const firestore = firebase.firestore();

exports.npsSurvey = functions.https.onRequest(async (req, res) => {
  const whitelist = ['user-ip'];
  const context = {};

  for (const key of whitelist) {
    if (req.headers[`x-appengine-${key}`]) {
      context[key] = req.headers[`x-appengine-${key}`];
    }
  }

  const required_config = [
    'bigquery_table',
    'firestore_collection',
    'redirect_link',
    'redirect_function',
  ];

  const missing_config = _difference(required_config, Object.keys(CONFIG));

  if (missing_config.length > 0) {
    res.status(500).send(`Missing config values: ${missing_config.join(',')}`);

    return false;
  }

  let redirectURL = CONFIG.redirect_link;

  try {
    const { person_id, survey_id, nps_score } = req.query;

    if (!person_id || !survey_id || !nps_score) {
      throw new Error('Missing required parameter');
    }

    const previousResults = await firestore
      .collection(CONFIG.firestore_collection)
      .where('person_id', '==', person_id)
      .where('survey_id', '==', survey_id)
      .get();

    // Make sure the user hasn't previously submitted a response to reduce duplicate entries
    if (previousResults.docs.length === 0) {
      console.log('Firebase Write');

      await firestore.collection(CONFIG.firestore_collection).add({
        person_id,
        survey_id,
        nps_score: Number(nps_score),
        ip_address: context['user-ip'],
        bigquery_sync_status: statuses.BIGQUERY_SYNC_UNKNOWN,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

    redirectURL += `?person_id=${person_id}&survey_id=${survey_id}&nps_score=${nps_score}`;

    console.log(`Redirecting to ${redirectURL}`);

    res.redirect(redirectURL);
  } catch (error) {
    console.error(error);

    console.log(`Redirecting to ${redirectURL}`);

    res.redirect(redirectURL);
  }

  return true;
});

exports.npsSurveyBigquerySync = functions.firestore
  .document(`${CONFIG.bigquery_table}/{docId}`)
  .onCreate(async snap => {
    const id = snap.id;
    const survey = snap.data();
    let bigquery_sync_status = statuses.BIGQUERY_SYNC_FAILURE;
    console.log(`Started npsSurveyBigquerySync - ${id}`);

    survey.response_id = id;
    survey.created_at = survey.created_at.toDate();
    survey.updated_at = survey.updated_at.toDate();

    try {
      console.log('Bigquery Write');

      const bigQueryResponse = await writeToTable('firedup', 'nps_responses', {
        json: survey,
      });

      bigquery_sync_status = statuses.BIGQUERY_SYNC_SUCCESS;

      console.log(
        `bigQueryResponse: ${JSON.stringify(
          bigQueryResponse
        )}, bigquery_sync_status: ${bigquery_sync_status} - ${id}`
      );
    } catch (error) {}

    await firestore
      .collection(CONFIG.firestore_collection)
      .doc(id)
      .set(
        {
          bigquery_sync_status,
        },
        { merge: true }
      )
      .then(() => {
        console.log(`Finished npsSurveyBigquerySync - ${id}`);
      });
  });
