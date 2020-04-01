import { get as _get } from 'lodash';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import { verifySuperAdminStatus } from './library/admin';
import { writeFirebaseUser } from '../../fired-up-bigquery/functions/library/bigquery';

const firestore = firebase.firestore();

// List of email addresses that should received super admin status
const superAdmins = [
  ''
];

export const firedupAdminVerification = functions.auth
  .user()
  .onCreate(async user => {
    return new Promise((resolve, reject) => {
      console.log('Started firedupAdminVerification');

      const providerID = _get(user, 'providerData[0].providerId', null);

      if (
        user.email &&
        providerID === 'google.com' &&
        superAdmins.indexOf(user.email) !== -1
      ) {
        return firebase
          .auth()
          .setCustomUserClaims(user.uid, { role: 'super-admin' })
          .then(() => {
            console.log(
              `User ${user.uid} <${user.email}> successfully verified as super admin`
            );

            firestore
              .collection('metadata')
              .doc(user.uid)
              .set({
                updated_at: firebase.firestore.FieldValue.serverTimestamp(),
              })
              .then(() => {
                resolve();
              })
              .catch(() => {
                resolve();
              });

            console.log('Finished firedupAdminVerification');
          })
          .catch(error => {
            console.error(error);

            reject();
          });
      } else {
        console.log(
          `User ${user.uid} <${user.email}> doesn\'t qualify as super admin`
        );

        return resolve();
      }
    });
  });

export const adminPostLogin = functions.https.onCall(async (_data, context) => {
  if (context.auth && context.auth.uid) {
    try {
      const docRef = firestore.collection('users').doc(context.auth.uid);
      const userReference = await docRef.get();
      const userData = userReference.data();

      await docRef.update({
        last_login_at: firebase.firestore.FieldValue.serverTimestamp(),
      });

      await writeFirebaseUser({
        firebase_id: context.auth.uid,
        email_address: context.auth.token.email,
        last_login_at: new Date().toISOString(),
        ...(userData.referrer_id && { referrer_id: userData.referrer_id }),
      });
    } catch (error) {
      console.error(error);
    }

    return;
  }
});

export const firedupAdminGetUserID = functions.https.onCall(
  async (data, context) => {
    if (!verifySuperAdminStatus(context)) {
      return { status: 'UNAUTHENTICATED' };
    }

    try {
      const user = await firebase.auth().getUserByEmail(data.email);
      return user;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
);
