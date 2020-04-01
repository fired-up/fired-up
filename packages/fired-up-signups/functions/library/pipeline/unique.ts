import * as firebase from 'firebase-admin';
import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

const firestore = firebase.firestore();

export default async function(signup: FiredUp.Signup) {
  let unique_signup = true;
  const previousSignup = await firestore
    .collection('signups')
    .where(
      'fields.email_address',
      '==',
      signup.fields.email_address.toLowerCase()
    )
    .orderBy('created_at', 'desc')
    .limit(2)
    .get();

  if (previousSignup.docs.length > 1) {
    unique_signup = false;
  }

  return {
    unique_signup,
  };
}
