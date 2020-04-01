import * as functions from 'firebase-functions';
import sendgrid from './library/sendgrid';

import { verifySuperAdminStatus } from '../../fired-up-admin/functions/library/admin';

import {
  createSendgridSegment,
  sendFailedLoginEmail,
} from './library/sendgrid';

import { peopleBatchSync } from './library/batch-sync';

export const sendgridWebhook = functions.https.onRequest(
  sendgrid.webhook.bind(null, 'Sendgrid')
);
export const sendgridNTIWebhook = functions.https.onRequest(
  sendgrid.webhook.bind(null, 'nti_sg')
);

const FIREDUP_ENVIRONMENT =
  functions.config().firedup.environment || 'production';

export const sendgridNewPeopleBatchSync = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async () => {
    try {
      if (FIREDUP_ENVIRONMENT !== 'development') {
        await peopleBatchSync();
      } else {
        console.log('Not running Sendgrid sync in development');
      }
    } catch (error) {
      console.error(error);
    }
  });

export const sendgridUpdatedPeopleBatchSync = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async () => {
    try {
      if (FIREDUP_ENVIRONMENT !== 'development') {
        await peopleBatchSync(true);
      } else {
        console.log('Not running Sendgrid sync in development');
      }
    } catch (error) {
      console.error(error);
    }
  });

/**
 * Send an array of conditions, create a segment
 * @body {string} name - name of the segment
 * @body {array} conditions - an array of segment conditions for sendgrid
 */
export const sendgridCreateSegment = functions.https.onCall(
  async (data, context) => {
    if (!verifySuperAdminStatus(context)) {
      return { status: 'UNAUTHENTICATED' };
    }

    return createSendgridSegment(data)
      .then(() => {
        return { status: 'OK' };
      })
      .catch(err => {
        return { ...err, status: 'Server error' };
      });
  }
);

/**
 * Endpoint to send transactional email when login fails
 */
export const sendgridSendFailedLoginEmail = functions.https.onCall(
  async data => {
    try {
      await sendFailedLoginEmail(data.email);
      return { status: 'OK' };
    } catch (err) {
      return { ...err, status: 'Server error' };
    }
  }
);
