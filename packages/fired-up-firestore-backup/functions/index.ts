import * as axios from 'axios';
import { google } from 'googleapis';
import * as functions from 'firebase-functions';

const COLLECTIONS = [
  'actblue_contributions',
  'autoresponders',
  'donations',
  'forms',
  'people',
  'signups',
  'users',
];

// https://firebase.google.com/docs/firestore/solutions/schedule-export
exports.firestoreBackup = functions.pubsub
  .schedule('every 2 hours')
  .onRun(async () => {
    const FIREBASE_CONFIG = JSON.parse(process.env.FIREBASE_CONFIG);
    const backupPath = `gs://${
      functions.config().firedup.backups_bucket
    }/firestore/${new Date().toISOString()}`;
    const url = `https://firestore.googleapis.com/v1beta1/projects/${FIREBASE_CONFIG.projectId}/databases/(default):exportDocuments`;

    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/datastore'],
    });

    const accessTokenResponse = await auth.getAccessToken();
    const accessToken = accessTokenResponse.token;

    try {
      const response = await axios.post(
        url,
        {
          outputUriPrefix: backupPath,
          collectionIds: COLLECTIONS,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + accessToken,
          },
        }
      );

      console.log(response.data);

      return true;
    } catch (error) {
      console.error(error);

      return false;
    }
  });
