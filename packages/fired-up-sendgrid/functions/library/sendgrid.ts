// import https from 'https';
import * as _ from 'lodash';
import * as async from 'async';
// import * as moment from 'moment';
import * as h2p from 'html2plaintext';
import * as mail from '@sendgrid/mail';
import * as firebase from 'firebase-admin';
import * as client from '@sendgrid/client';
import * as functions from 'firebase-functions';
import { BigQuery } from '@google-cloud/bigquery';

import statuses from './sync-statuses.js';
import { logAPIrequest } from '../../../fired-up-core/functions/library/api-logger';

try {
  firebase.initializeApp();
} catch (error) {}

const firestore = firebase.firestore();

// We need two Sendgrid accounts:
// * One which has an IP group safe for autoresponders that won't harm the primary list
const SENDGRID_FROM = functions.config().sendgrid.from;

const SENDGRID_KEY = functions.config().sendgrid.key;
const SENDGRID_TEMPLATE = functions.config().sendgrid.template;
// const SENDGRID_IP_GROUP = functions.config().sendgrid.ip_group;
const SENDGRID_UNSUB_GROUP = functions.config().sendgrid.unsub_group;
// * One for dashboard whose users will likely always open messages.
const SENDGRID_TRANSACTIONAL_KEY = functions.config().sendgrid
  .transactional_key;
const SENDGRID_TRANSACTIONAL_TEMPLATE = functions.config().sendgrid
  .transactional_template;
// const SENDGRID_TRANSACTIONAL_IP_GROUP = functions.config().sendgrid.transactional_ip_group;
// const SENDGRID_TRANSACTIONAL_UNSUB_GROUP = functions.config().sendgrid.transactional_unsub_group;

const FIREDUP_ENV = functions.config().firedup
  ? functions.config().firedup.environment
  : 'production';

const SYNCED_FIELDS = [
  'given_name', // set
  'family_name', // set
  'phone_number', // set
  'created_at', // set
  'updated_at', // set
  'address_line1', // set
  'address_line2', // set
  'locality', // set
  'region', // set
  'region_full', //set
  'postal_code', // set
  'token', // set
  'person_id', // set
  'firebase_user_id',
  //'latitude', // needs manual transformation to float
  //'longitude', // needs manual transformation to float
  'honorific_suffix', // set
  'honorific_prefix', // set
  'employer', // set
  'occupation', // set
  'hygiene_email_validity',
  'submitted_forms',
  'actions_taken',
  'welcome_status',
  'donor_types',
  'origin_source',
];

const bigquery = new BigQuery({
  //projectId: functions.config().projectId,
});

/**
 * Copy lists from Sendgrid to Firebase so that we can show them in a dropdown to help form editors
 * Fired Up: this belongs in a Sendgrid-specific package
 */
function syncLists() {
  return new Promise((resolve, reject) => {
    client
      .request({
        method: 'GET',
        url: '/v3/contactdb/lists',
        forever: true,
      })
      .then(([response, body]: any) => {
        logAPIrequest(
          'Sendgrid',
          'syncLists()',
          'GET',
          'https://api.sendgrid.com/v3/contactdb/lists',
          response.statusCode
        );
        async.each(
          body.lists,
          (list, callback) => {
            firestore
              .collection('sendgrid_lists')
              .doc(`list_${String(list.id)}`)
              .set(
                {
                  // DO NOT sync list item here, subscribers count needn't be saved
                  id: list.id,
                  name: list.name,
                },
                {
                  merge: true, // Rename existing lists
                }
              )
              .then(() => {
                callback();
              })
              .catch(error => {
                console.error(error);
                reject();
              });
          },
          error => {
            if (error) {
              console.error(error);
              reject();
            } else {
              resolve();
            }
          }
        );
      })
      .catch(error => {
        console.log(error);

        logAPIrequest(
          'Sendgrid',
          'syncLists()',
          'GET',
          'https://api.sendgrid.com/v3/contactdb/lists',
          error.response.statusCode
        );

        console.error(error.response ? error.response.body : error);
        reject();
      });
  });
}

/**
 * Subscribe a given user to a specific list.
 * Note: Don't use this to initially add a contact,
 * as this doesn't handle any custom fields needed for segments.
 * @param email
 * @param listID
 */
export function subscribeToList(lists: any, email: string) {
  mail.setApiKey(SENDGRID_KEY);
  client.setApiKey(SENDGRID_KEY);

  return new Promise((resolve, reject) => {
    async.each(
      lists,
      (list, callback) => {
        const contactID = Buffer.from(email).toString('base64');
        const path = `/v3/contactdb/lists/${list}/recipients/${contactID}`;

        client
          .request({
            method: 'POST',
            url: path,
            forever: true,
          })
          .then(([response, body]: any) => {
            logAPIrequest(
              'Sendgrid',
              'subscribeToList()',
              'POST',
              'https://api.sendgrid.com/v3/contactdb/lists/%list/recipients/%contactID',
              response.statusCode
            );
            callback();
          })
          .catch(error => {
            console.log(error);

            logAPIrequest(
              'Sendgrid',
              'subscribeToList()',
              'POST',
              'https://api.sendgrid.com/v3/contactdb/lists/%list/recipients/%contactID',
              error.response.statusCode
            );
            callback(error);
          });
      },
      error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Send a defined autoresponder
 * @param {object} autoresponder
 * @param email
 */
export const sendAutoresponder = (autoresponder, email: string) => {
  mail.setApiKey(SENDGRID_KEY);
  client.setApiKey(SENDGRID_KEY);

  return new Promise((resolve, reject) => {
    // Returns if autoresponder is hardcoded to use TS template
    let htmlContent = autoresponder.content;
    let plaintextContent = h2p(autoresponder.content);

    const message: any = {
      to: email,
      html: htmlContent,
      from: SENDGRID_FROM,
      text: plaintextContent,
      templateId: SENDGRID_TEMPLATE,
      subject: autoresponder.subject,
    };

    // Override some values for development mode
    if (FIREDUP_ENV !== 'development') {
      // Not using unsub group or ip pool
      //message.ip_pool_name = SENDGRID_IP_GROUP;
    }

    if (SENDGRID_UNSUB_GROUP) {
      message.asm = { groupId: Number(SENDGRID_UNSUB_GROUP) };
    }

    mail
      .send(message)
      .then(() => {
        // ( component, context, resource, status, initator )
        logAPIrequest(
          'Sendgrid',
          'sendAutoresponder()',
          'POST',
          'https://api.sendgrid.com/mail/send',
          200
        );

        resolve();
      })
      .catch(error => {
        // ( component, context, resource, status, initator )
        logAPIrequest(
          'Sendgrid',
          'sendAutoresponder()',
          'POST',
          'https://api.sendgrid.com/mail/send',
          400
        );

        console.error(error.response ? error.response.body : error);
        reject();
      });
  });
};

/**
 * Process a sendgrid webhook into BigQuery
 * @param req
 * @param res
 */
async function webhook(dataset: string | null, req: any, res: any) {
  console.log('Started sendgridWebhook');

  const rows = req.body;
  const emailsSentRows = [];
  const emailsOpenedRows = [];
  const emailsClickedRows = [];
  const emailsGroupUnsubRows = [];
  const emailsUnsubRows = [];
  const emailsUnsentRows = [];

  // SendGrid sends an array of events as the body - it groups them
  for (const i in rows) {
    const type = rows[i].event;

    const fields: any = {
      sg_event_id: rows[i].sg_event_id,
      sg_message_id: rows[i].sg_message_id,
      email_address: rows[i].email,
      event_date: Number(rows[i].timestamp),
      ip: rows[i].ip,
      category:
        rows[i].category && Array.isArray(rows[i].category)
          ? rows[i].category.join('|')
          : null,
      sg_campaign_name: rows[i].marketing_campaign_name,
      sg_campaign_id: rows[i].marketing_campaign_id,
    };

    switch (type) {
      case 'dropped':
      case 'bounce':
      case 'deferred':
        fields.event = rows[i].event || null;
        fields.reason = rows[i].reason || null;
        fields.status = rows[i].status || null;
        fields.response = rows[i].response || null;
        fields.attempt = rows[i].attempt || null;
        fields.type = rows[i].type || null;
        fields.smtp_id = rows[i]['smtp-id'];
        fields.sg_campaign_version = rows[i].marketing_campaign_version || null;
        fields.sg_campaign_split_id =
          rows[i].marketing_campaign_split_id || null;

        emailsUnsentRows.push({
          insertId: rows[i].sg_event_id, // This is just to prevent duplicates within BigQuery. Sendgrids test data doesn't change these so not sure if it works yet.
          json: fields,
        });
        break;

      case 'delivered':
        fields.smtp_id = rows[i]['smtp-id'];
        fields.sg_campaign_version = rows[i].marketing_campaign_version || null;
        fields.sg_campaign_split_id =
          rows[i].marketing_campaign_split_id || null;

        emailsSentRows.push({
          insertId: rows[i].sg_event_id,
          json: fields,
        });

        break;

      case 'open':
        fields.useragent = rows[i].useragent;

        emailsOpenedRows.push({
          insertId: rows[i].sg_event_id,
          json: fields,
        });

        break;

      case 'click':
        fields.url = rows[i].url;
        fields.useragent = rows[i].useragent;

        emailsClickedRows.push({
          insertId: rows[i].sg_event_id,
          json: fields,
        });

        break;

      case 'group_unsubscribe':
      case 'group_resubscribe':
        fields.asm_group_id = rows[i].asm_group_id;
        fields.type = rows[i].type;
        fields.useragent = rows[i].useragent;

        emailsGroupUnsubRows.push({
          insertId: rows[i].sg_event_id,
          json: fields,
        });

        break;

      case 'unsubscribe':
      case 'spamreport':
        fields.type = type;

        emailsUnsubRows.push({
          insertId: rows[i].sg_event_id,
          json: fields,
        });
    }
  }

  function tableWrite(table: string, rows: Array<any>) {
    return new Promise((resolve, reject) => {
      bigquery
        .dataset(dataset || 'Sendgrid')
        .table(table)
        .insert(rows, { raw: true }, (error, response) => {
          if (error) {
            console.log(
              'Sendgrid Webhook BigQuery Write Error',
              JSON.stringify(error, null, 4)
            );

            resolve();
          } else {
            resolve();
          }
        });
    });
  }

  if (emailsSentRows.length > 0) {
    try {
      await tableWrite('emails_sent', emailsSentRows);
    } catch (error) {
      console.error('Could not write to emails_sent');
    }
  }

  if (emailsUnsentRows.length > 0) {
    try {
      await tableWrite('emails_unsent', emailsUnsentRows);
    } catch (error) {
      console.error('Could not write to emails_unsent');
    }
  }

  if (emailsOpenedRows.length > 0) {
    try {
      await tableWrite('emails_opened', emailsOpenedRows);
    } catch (error) {
      console.error('Could not write to emails_opened');
    }
  }

  if (emailsClickedRows.length > 0) {
    try {
      await tableWrite('emails_clicked', emailsClickedRows);
    } catch (error) {
      console.error('Could not write to emails_clicked');
    }
  }

  if (emailsGroupUnsubRows.length > 0) {
    try {
      await tableWrite('emails_group_unsubscribed', emailsGroupUnsubRows);
    } catch (error) {
      console.error('Could not write to emails_group_unsubscribed');
    }
  }

  if (emailsUnsubRows.length > 0) {
    try {
      await tableWrite('emails_unsubscribed', emailsUnsubRows);
    } catch (error) {
      console.error('Could not write to emails_unsubscribed');
    }
  }

  console.log('Finished sendgridWebhook');

  res.sendStatus(200);
}

/**
 * Performs a search of users by conditions. Does not create a segment
 * @param - a SGQL query
 * @returns {number} - number of users who satisfy provided condition
 */
export const getRecipientsCount = async (query: Array<object>) => {
  mail.setApiKey(SENDGRID_KEY);
  client.setApiKey(SENDGRID_KEY);

  const requestOpts = {
    body: { query },
    method: 'POST',
    url: '/v3/marketing/contacts/search',
    forever: true,
  };
  try {
    const [response, body] = await client.request(requestOpts);
    logAPIrequest(
      'Sendgrid',
      'getRecipientsCount()',
      'POST',
      'https://api.sendgrid.com/v3/marketing/contacts/search',
      response.statusCode
    );
    return body.contact_count;
  } catch (error) {
    logAPIrequest(
      'Sendgrid',
      'getRecipientsCount()',
      'POST',
      'https://api.sendgrid.com/v3/marketing/contacts/search',
      error.response.statusCode
    );
    return error;
  }
};

/**
 * Create a segment from provided conditions
 * @param {object} obj - An object of...
 * @param {string} obj.name - name of segment
 * @param {object} obj.conditions - an array of SendGrid conditions
 */
export const createSendgridSegment = async ({
  name,
  conditions,
}: {
  name: string;
  conditions: Array<object>;
}) => {
  mail.setApiKey(SENDGRID_KEY);
  client.setApiKey(SENDGRID_KEY);

  const requestOpts = {
    body: { name, conditions },
    method: 'POST',
    url: '/v3/contactdb/segments',
    forever: true,
  };

  try {
    const [response, body] = await client.request(requestOpts);
    logAPIrequest(
      'Sendgrid',
      'createSendgridSegment()',
      'POST',
      'https://api.sendgrid.com/v3/contactdb/segments',
      response.statusCode
    );
    return;
  } catch (error) {
    console.log(error);

    logAPIrequest(
      'Sendgrid',
      'createSendgridSegment()',
      'POST',
      'https://api.sendgrid.com/v3/contactdb/segments',
      error.response.statusCode
    );
    return error;
  }
};

/**
 * Send an email saying login failed
 * @param {string} email - Email address to send to
 */
export const sendFailedLoginEmail = async (email: string) => {
  // Send via a different Sendgrid subuser to allow unsubed users to login
  mail.setApiKey(SENDGRID_TRANSACTIONAL_KEY);
  client.setApiKey(SENDGRID_KEY);

  const messageContent = '';

  const message = {
    to: email,
    html: messageContent,
    subject: 'Recent login attempt',

    from: SENDGRID_FROM,
    templateId: SENDGRID_TRANSACTIONAL_TEMPLATE,
  };

  try {
    await mail.send(message);
    logAPIrequest(
      'Sendgrid',
      'sendFailedLoginEmail()',
      'POST',
      'https://api.sendgrid.com/mail/send',
      200
    );
    return;
  } catch (err) {
    console.log(err);
    logAPIrequest(
      'Sendgrid',
      'sendFailedLoginEmail()',
      'POST',
      'https://api.sendgrid.com/mail/send',
      400
    );
    return err;
  }
};

/**
 * Sends an email previously defined in sendgrid.
 * @param recipientEmail - Email address of recipient
 * @param emailDetails.content - String of reday-to-go HTML
 * @param emailDetails.templateId - A valid sendgrid templateId
 */
export const sendTransactionalEmail = async (
  recipientEmail: string,
  emailDetails: {
    content: string;
    from?: string;
    subject: string;
  },
  useTransactionalAccount: boolean = false
) => {
  console.log('Attempting sendTransactionalEmail');

  mail.setApiKey(SENDGRID_KEY);
  client.setApiKey(SENDGRID_KEY);

  if (!recipientEmail || !emailDetails.content) {
    throw 'Missing critical property in sendTransactionalEmail';
  }

  const message: any = {
    to: recipientEmail,
    from: emailDetails.from || SENDGRID_FROM,
    html: emailDetails.content,
    subject: emailDetails.subject,
    text: h2p(emailDetails.content),
    templateId: SENDGRID_TEMPLATE,
  };

  // Override some values for development mode
  if (FIREDUP_ENV !== 'production' && !useTransactionalAccount) {
    mail.setApiKey(SENDGRID_TRANSACTIONAL_KEY);
    message.templateId = SENDGRID_TRANSACTIONAL_TEMPLATE;
  } else {
    // Not using unsub group or ip pool
    //message.ip_pool_name = SENDGRID_IP_GROUP;
    //message.asm = { groupId: SENDGRID_UNSUB_GROUP };
  }

  try {
    await mail.send(message);

    logAPIrequest(
      'Sendgrid',
      'sendTransactionalEmail()',
      'POST',
      'https://api.sendgrid.com/mail/send',
      200
    );

    return;
  } catch (error) {
    logAPIrequest(
      'Sendgrid',
      'sendTransactionalEmail()',
      'POST',
      'https://api.sendgrid.com/mail/send',
      400
    );

    console.error(JSON.stringify(error.response.body));
  }
};

export default {
  webhook,
  syncLists,
  subscribeToList,
  sendAutoresponder,
};
