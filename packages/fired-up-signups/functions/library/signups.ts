import * as _ from 'lodash';
import * as firebase from 'firebase-admin';

import people from '../../../fired-up-people/functions/library/people';
import sendgrid from '../../../fired-up-sendgrid/functions/library/sendgrid';

const firestore = firebase.firestore();

// https://docs.google.com/spreadsheets/d/1yS3c-cq0cu3BGs6RbVnXH5QXZPcXjMjyDur9lLLYFc0/edit#gid=1555532866
interface Signup {
  created_at?: object; // typeof serverTimestamp === object. Added at firebase write time
  fields?: object;
  form_id?: string;
  type?: string;
  submissionURL?: string;
  utm?: string;
}

/**
 * Get Form code originally from /plugins/admin-signups/library/forms.js
 * @param id
 * @param slug
 * @returns {Promise<object>} resolve with data if success, reject if failed
 */
export const getForm = (id: string) => {
  return new Promise(async (resolve, reject) => {
    if (id) {
      try {
        const doc = await firestore
          .collection('forms')
          .doc(id)
          .get();

        if (doc.exists) {
          resolve(doc.data());
        } else {
          reject('Form Not Found');
        }
      } catch (error) {
        console.error(error);
        reject();
      }
    } else {
      reject('ID or Slug required');
    }
  });
};

/**
 * Determine if email address submitted is unique to given form
 * @param formSlug
 * @param email
 * @returns {Promise<boolean>} resolve with true if unique, false if not unique
 */
export const isEmailSubmissionUnique = (formID, email) => {
  return new Promise(async (resolve, reject) => {
    try {
      const snapshot = await firestore
        .collection('signups')
        .where('fields.email_address', '==', email)
        .where('form_id', '==', formID)
        .get();

      const signups = [];

      snapshot.forEach(signup => signups.push(signup.data()));

      if (signups.length > 1) {
        resolve(false);
      } else {
        resolve(true);
      }
    } catch (error) {
      reject();
    }
  });
};

/**
 * Subscribe an email address to Sendgrid List ID set in the Fired Up Form options
 * @param form {object} - Fired Up Form Object
 * @param fields {object} - Fired Up Signup submitted by users
 * @returns {Promise<object>}  - resolve if success/reject if failed
 */
export const subscribeSendgridLists = (form, fields) => {
  return new Promise((resolve, reject) => {
    if (
      Array.isArray(form.sendgrid_subscriptions) &&
      form.sendgrid_subscriptions.length > 0
    ) {
      if (
        !form.sendgrid_optin_optional ||
        (form.sendgrid_optin_optional && fields.sendgrid_optin)
      ) {
        sendgrid
          .subscribeToList(form.sendgrid_subscriptions, fields.email_address)
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      } else {
        // User opted-out of emails
        resolve();
      }
    } else {
      // No lists to subscribe to
      resolve();
    }
  });
};

/**
 * Use Firestore Transaction to increment counter for a signup
 * @param id
 * @returns {Promise} resolve if success, reject if failed
 */
export const incrementFormCounter = id => {
  return new Promise((resolve, reject) => {
    const ref = firestore.collection('forms').doc(id);

    return firestore
      .runTransaction(transaction => {
        // This code may get re-run multiple times if there are conflicts.

        return transaction.get(ref).then(doc => {
          if (!doc.exists) {
            throw 'Document does not exist!';
          }

          const newTotal = doc.data().total_submissions + 1;
          transaction.update(ref, { total_submissions: newTotal });
        });
      })
      .then(() => {
        resolve();
      })
      .catch(error => {
        reject(error);
      });
  });
};

/**
 * Logs a signup to firebase
 * @return {Promise<string>} - resolve with path if success, reject with error if failed
 */
export const logSignup = async (signupData: Signup) => {
  try {
    const result = await firestore.collection('signups').add({
      ...signupData,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Created signup at ${result.path}`);

    return result.path;
  } catch (error) {
    console.error(error);

    return error;
  }
};

export default {
  getForm,
  logSignup,
  incrementFormCounter,
  subscribeSendgridLists,
  isEmailSubmissionUnique,
};
