import * as firebase from 'firebase-admin';
import * as randomize from 'randomatic';

import intercomSyncStatuses from '../../../fired-up-intercom/functions/library/sync-statuses';
import sendgridSyncStatuses from '../../../fired-up-sendgrid/functions/library/sync-statuses';

import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';

const firestore = firebase.firestore();
/**
 * Return the Firebase Auth User ID for a given email address, or return null if user doesn't exist
 * @param email_address
 * @returns {Promise<string>}
 */
async function firebaseAuthID(email_address: string): Promise<string> {
  console.log('Auth: getting Firebase auth ID');

  try {
    const user = await firebase.auth().getUserByEmail(email_address);
    return user.uid || null;
  } catch (error) {
    return null;
  }
}

/**
 * Return true if a valid (with required fields set) user profile record exists. False if record missing, or fields missing
 * @param user_id
 * @returns {Promise<boolean>}
 */
async function userProfileExists(user_id: string): Promise<boolean> {
  console.log('Auth: checking user profile validity');

  const required_fields = ['email_address', 'given_name', 'family_name'];

  try {
    const profileDoc = await firestore
      .collection('users')
      .doc(user_id)
      .get();

    const profileData = profileDoc.data();

    let hasRequiredFields = true;

    for (const field of required_fields) {
      if (!profileData[field]) {
        hasRequiredFields = false;
      }
    }

    // true if doc exists and all required field are present
    return profileDoc.exists && hasRequiredFields;
  } catch (error) {
    console.error(error);

    return null;
  }
}

/**
 * Return the Fired Up Person Record for given person ID.
 * @param person_id
 * @returns {Promise<FiredUp.Person>}
 */
async function getPersonRecord(person_id: string): Promise<FiredUp.Person> {
  console.log('Auth: getting person record');

  try {
    const personDoc = await firestore
      .collection('people')
      .doc(person_id)
      .get();

    const personData = personDoc.data();

    return personData;
  } catch (error) {
    console.error(error);

    return null;
  }
}

/**
 * Create a Firebase Auth Login record for the given email address
 * @param email_address
 * @returns {Promise<string>}
 */
async function createAuthUser(email_address): Promise<string> {
  console.log('Auth: creating Firebase Auth user');

  try {
    /**
     * Firebase requires a password for our setup, so we generate a long, random string
     * This string is not saved nor will it ever be used by end user.
     */
    const generatedPassword = randomize('Aa0!', 25);

    const user = await firebase.auth().createUser({
      email: email_address,
      password: generatedPassword,
    });

    return user.uid;
  } catch (error) {
    throw error;
  }
}

/**
 * Upsert FiredUp.Person into a users profile. Works on new and existing users
 * @param user_id
 * @param fields
 * @returns {Promise<void>}
 */
async function createUserProfile(
  user_id: string,
  fields: FiredUp.Person
): Promise<void> {
  console.log('Auth: creating Dashboard user profile');

  try {
    // Upsert email, first, last values.
    // The merge: true allows this to work regardless of existing document
    /// Firestore's .update() requires an existing document

    await firestore
      .collection('users')
      .doc(user_id)
      .set(
        {
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
          updated_at: firebase.firestore.FieldValue.serverTimestamp(),
          ...fields,
        },
        { merge: true }
      );

    return;
  } catch (error) {
    throw error;
  }
}

/**
 * Adds the person into the Intercom, Bigquery, and Sendgrid update queue
 * @param person_id
 * @returns {Promise<void>}
 */
async function setSyncStatus(person_id, user_id): Promise<void> {
  try {
    await firestore
      .collection('people')
      .doc(person_id)
      .update({
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        firebase_user_id: user_id,
        sendgrid_sync_status: sendgridSyncStatuses.SENDGRID_SYNC_FAILED_UPDATE,
        intercom_sync_status:
          intercomSyncStatuses.INTERCOM_SYNC_QUEUED_INITIALLY,
      });

    return;
  } catch (error) {
    throw error;
  }
}

/**
 * Creates a fresh user record.
 * This is intended to be used when we know there isn't an existing user
 * @param person_id
 * @returns {Promise<string>}
 */
export async function createDashboardUser(person_id: string): Promise<string> {
  console.log('Auth: creating fresh Dashboard user');

  try {
    const person: FiredUp.Person = await getPersonRecord(person_id);

    if (!person) {
      throw new Error(`Person ID ${person_id} does not exist`);
    }

    const email_address: string = person.email_address;
    const existing_user_id: string = await firebaseAuthID(email_address);

    // The user already exists, return their user ID.
    if (existing_user_id) {
      return existing_user_id;
    }

    // Create Firebase login user
    const user_id: string = await createAuthUser(email_address);

    // Create Dashboard User profile
    await createUserProfile(user_id, {
      given_name: person.given_name,
      family_name: person.family_name,
      email_address: person.email_address,
      region: person.region,
      locality: person.locality,
      postal_code: person.postal_code,
    });

    await setSyncStatus(person_id, user_id);

    return user_id;
  } catch (error) {
    throw error;
  }
}

/**
 * Ensures a valid user exists for the given person
 * Validates and repairs missing required data (/users profile, data) for dashboards
 * This is intended to be used when a user could exist, but potientally might not
 * @param person_id
 * @returns {Promise<string>}
 */
export async function ensureDashboardUser(person_id: string): Promise<string> {
  console.log('Auth: validating Dashboard user data');

  try {
    const person: FiredUp.Person = await getPersonRecord(person_id);

    if (!person) {
      throw new Error(`Person ID ${person_id} does not exist`);
    }

    const email_address: string = person.email_address;
    const existing_user_id: string = await firebaseAuthID(email_address);

    // If the person doesn't exist, push them through the creation code
    if (!existing_user_id) {
      return await createDashboardUser(person_id);
    }

    // Verify valid user record exists
    const validProfileExists = await userProfileExists(existing_user_id);

    if (!validProfileExists) {
      // Create or add required fields to user profile
      await createUserProfile(existing_user_id, {
        given_name: person.given_name,
        family_name: person.family_name,
        email_address: person.email_address,
        region: person.region,
        locality: person.locality,
        postal_code: person.postal_code,
      });
    }

    await setSyncStatus(person_id, existing_user_id);

    return existing_user_id;
  } catch (error) {
    throw error;
  }
}

export default {
  createDashboardUser,
  ensureDashboardUser,
};
