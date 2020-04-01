import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { forIn as _forIn, get as _get } from 'lodash';
import { middleware as webhookMiddleware } from 'x-hub-signature';

import { peopleBatchSync } from './library/batch-sync';
import { generateHashFromUid } from './library/intercom';
import { handleCustomAssignments } from './library/assignments';

const firestore = admin.firestore();

const xhub = webhookMiddleware({
  require: true,
  algorithm: 'sha1',
  getRawBody: req => req.rawBody,
  secret: functions.config().intercom.secret,
});

export const intercomUserHash = functions.https.onCall(
  async (_data, context) => {
    if (context && context.auth && context.auth.uid) {
      const uid = context.auth.uid;
      const hash = generateHashFromUid(uid);

      return { uid, hash };
    }

    return { uid: null, hash: null };
  }
);

// TODO: Rename to proper functions name convetion
export const generateIntercomHash = intercomUserHash;

enum entrypoint {
  Donation = 'donation',
  Signup = 'signup',
}

/**
 * Gets info about a user's donation.
 */
const fetchUserDonationInfo = async (email: string): Promise<{}> => {
  const lowercaseEmail = email.toLowerCase();
  const donationRecords = await firestore
    .collection('donations')
    .where('fields.email_address', '==', lowercaseEmail)
    .get();

  // If there are no donation records, the user didn't enter via donation
  if (donationRecords.size == 0) {
    return null;
  }

  let refcode;

  // Is there a refcode?
  donationRecords.forEach(record => {
    const recordData = record.data();
    if (recordData.actblue_refcode) {
      refcode = recordData.actblue_refcode;
    }
  });

  return {
    donation_source: 'direct',
  };
};

export const intercomNewPeopleBatchSync = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async context => {
    try {
      await peopleBatchSync();
    } catch (error) {
      console.error(error);
    }
  });

export const intercomUpdatedPeopleBatchSync = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async context => {
    try {
      await peopleBatchSync('update');
    } catch (error) {
      console.error(error);
    }
  });

export const intercomWebhook = functions.https.onRequest(async (req, res) => {
  xhub(req, res, async () => {
    try {
      const user = _get(req.body.data, 'item');

      if (user && user.email) {
        await handleCustomAssignments(user);
      }

      return res.sendStatus(200);
    } catch (error) {
      throw new Error(error);
    }
  });
});

export const intercomOrganizerAssignment = functions.https.onCall(
  async data => {
    try {
      await handleCustomAssignments({
        email: data.email_address,
      });
    } catch (error) {
      console.error(error);
    }

    return;
  }
);
