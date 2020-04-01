import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

try {
  firebase.initializeApp();
} catch (error) {}

const firestore = firebase.firestore();

export default async function(signup: FiredUp.Signup, id: string) {
  const KICKBOX_KEY =
    process.env.SENDGRID_API_KEY || functions.config().kickbox.key;

  if (!signup.unique_signup) {
    /**
     * Use validation values from previous email hygiene lookup
     */
    console.log(`Kickbox - Using previous email hygiene values - ${id}`);

    const previousSignups: any = await firestore
      .collection('signups')
      .where(
        'fields.email_address',
        '==',
        signup.fields.email_address.toLowerCase()
      )
      .orderBy('created_at', 'desc')
      .limit(2)
      .get();

    // Use the previous signup. .docs[0] is this signup.
    try {
      const previousSignup = previousSignups.docs[1].data();

      if (!previousSignup.hygiene_email_validity) {
        console.log(
          `Kickbox - Hygiene data cannot be fetched from previous signup, will grab fresh data - ${id}`
        );
        throw new Error('Hygiene data unavailable');
      }

      return {
        hygiene_email_validity: previousSignup.hygiene_email_validity,
        hygiene_metadata: previousSignup.hygiene_metadata || {},
        hygiene_service: previousSignup.hygiene_service || null,
        fields: {
          ...signup.fields,
          hygiene_email_validity: previousSignup.fields.hygiene_email_validity,
        },
      };
    } catch (error) {}
  }

  console.log(`Kickbox - Using fresh email hygiene values - ${id}`);

  const kickbox = require('kickbox')
    .client(KICKBOX_KEY)
    .kickbox();

  let result = null;
  let metadata = {};

  await new Promise((resolve, reject) => {
    kickbox.verify(signup.fields.email_address, (error, response) => {
      if (error) {
        reject();
      } else {
        const { body } = response;
        switch (body.result) {
          case 'deliverable':
            result = 'valid';
            break;

          case 'undeliverable':
            result = 'invalid';
            break;

          case 'risky':
            result = 'risky';
            break;

          default:
            result = 'unknown';
            break;
        }

        metadata = {
          kickbox_role: body.role,
          kickbox_reason: body.reason,
          kickbox_sendex: body.sendex,
          kickbox_disposable: body.disposable,
          kickbox_accept_all: body.accept_all,
          kickbox_did_you_mean: body.did_you_mean,
        };

        resolve();
      }
    });
  });

  return {
    hygiene_email_validity: result,
    hygiene_metadata: metadata,
    hygiene_service: 'kickbox',
    fields: {
      ...signup.fields,
      hygiene_email_validity: result,
    },
  };
}
