import * as firebase from 'firebase-admin';
import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

try {
  firebase.initializeApp();
} catch (error) {}

const firestore = firebase.firestore();

export default async function(signup: FiredUp.Signup) {
  let unique_donation = true;
  const previousSignup = await firestore
    .collection('donations')
    .where(
      'fields.email_address',
      '==',
      signup.fields.email_address.toLowerCase()
    )
    .orderBy('created_at', 'desc')
    .limit(2)
    .get();

  if (previousSignup.docs.length > 1) {
    unique_donation = false;
  }

  return {
    unique_donation,
  };
}
