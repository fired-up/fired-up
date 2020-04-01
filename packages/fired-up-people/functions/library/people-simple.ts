import { get as _get } from 'lodash';
import firebase from 'firebase-admin';

const firestore = firebase.firestore();

const WHITELISTED_FIELDS = [
  'created_at',
  'updated_at',
  'given_name',
  'family_name',
  'email_address',
  'phone_number_number',
  'address_line1',
  'address_line2',
  'latitude',
  'longitude',
  'locality',
  'region',
  'postal_code'
];

export async function upsertPersonSimple(personID, personFull) {
  try {
    const personSimple = {};

    for (const field of WHITELISTED_FIELDS) {
      const value = _get(personFull, field, null);
      personSimple[field] = value;
    }

    await firestore
      .collection('people_simple')
      .doc(personID)
      .set(personSimple, { merge: true });
  } catch (error) {
    console.error(error);
  }

  return;
}

export default {
  upsertPersonSimple,
};
