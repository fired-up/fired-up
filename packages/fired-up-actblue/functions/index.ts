import * as auth from 'basic-auth';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';
import { PubSub } from '@google-cloud/pubsub';

const CONFIG = require('../config.json');

try {
  firebase.initializeApp();
} catch (error) {}

const pubsub = new PubSub({
  projectId: process.env.GCLOUD_PROJECT,
});

const firestore = firebase.firestore();

const admins = {
  actblue: {
    password: CONFIG.auth_password,
  },
};

exports.actblueWebhook = functions.https.onRequest(async (req, res) => {
  const user = auth(req);

  if (
    req.body &&
    user &&
    admins[user.name] &&
    admins[user.name].password === user.pass
  ) {
    console.log('Started actblueWebhook');

    const data = req.body;

    const actblueContribution = {
      insertId: data.contribution.uniqueIdentifier || new Date().getTime(),
      created_at: data.contribution.createdAt || null,
      given_name: data.donor.firstname || null,
      family_name: data.donor.lastname || null,
      email_address: data.donor.email || null,
      phone_number: data.donor.phone || null,
      address_line1: data.donor.addr1 || null,
      locality: data.donor.city || null,
      region: data.donor.state || null,
      postal_code: data.donor.zip || null,
      country: data.donor.country || null,
      employer: data.donor.employerData.employer || null,
      occupation: data.donor.employerData.occupation || null,
      employer_address_line1: data.donor.employerData.employerAddr1 || null,
      employer_locality: data.donor.employerData.employerCity || null,
      employer_region: data.donor.employerData.employerState || null,
      employer_country: data.donor.employerData.employerCountry || null,
      order_number: data.contribution.orderNumber || null,
      contribution_form: data.contribution.contributionForm || null,
      refcode: data.contribution.refcode || null,
      refcode2: data.contribution.refcode2 || null,
      credit_card_expiration: data.contribution.creditCardExpiration || null,
      recurring_period: data.contribution.recurringPeriod || null,
      recurring_duration: data.contribution.recurringDuration || null,
      ab_test_name: data.contribution.abTestName || null,
      is_paypal: data.contribution.isPaypal || null,
      is_mobile: data.contribution.isMobile || null,
      ab_test_varation: data.contribution.abTestVariation || null,
      is_express: data.contribution.isExpress || null,
      with_express_lane: data.contribution.withExpressLane || null,
      express_signup: data.contribution.expressSignup || null,
      unique_identifier: data.contribution.uniqueIdentifier || null,
      status: data.contribution.status || null,
      thanks_url: data.contribution.thanksUrl || null,
      retry_url: data.contribution.retryUrl || null,
      cancelled_at: data.contribution.cancelledAt || null,
      recurring_type: data.contribution.recurringType || null,
      recur_completed: data.contribution.recurCompleted || null,
      recur_pledged: data.contribution.recurPledged || null,
      actblue_isEligibleForExpressLane:
        data.donor.isEligibleForExpressLane || null,
      line_items: [
        {
          sequence: data.lineitems[0].sequence || null,
          entity_id: data.lineitems[0].entityId || null,
          fec_id: data.lineitems[0].fecId || null,
          committee_name: data.lineitems[0].committeeName || null,
          amount: data.lineitems[0].amount || null,
          paid_at: data.lineitems[0].paidAt || null,
          line_item_id: data.lineitems[0].lineitemId || null,
          refunded_at: data.lineitems[0].refundedAt || null,
          disbursed_at: data.lineitems[0].disbursedAt || null,
          recovered_at: data.lineitems[0].recoveredAt || null,
        },
      ],
    };

    const firedUpDonation = {
      fields: {
        given_name: data.donor.firstname || null,
        family_name: data.donor.lastname || null,
        address_line1: data.donor.addr1 || null,
        locality: data.donor.city || null,
        region: data.donor.state || null,
        postal_code: data.donor.zip || null,
        employer: data.donor.employerData.employer || null,
        occupation: data.donor.employerData.occupation || null,
        email_address: data.donor.email || null,
        phone_number: data.donor.phone || null,
        amount: data.lineitems[0].amount || null,
      },
      type: 'actblue',
      form_id: data.contribution.contributionForm || null,
      actblue_id: data.contribution.uniqueIdentifier || null,
      actblue_refcode: data.contribution.refcode || null,
      actblue_refcode2: data.contribution.refcode2 || null,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      const pubsubWrite = pubsub
        .topic(CONFIG.pubsub_topic)
        .publish(Buffer.from(JSON.stringify(actblueContribution)));

      const actblueFirestoreWrite = firestore
        .collection(CONFIG.firestore_collection)
        .add(actblueContribution);

      const firedupFirebaseWrite = firestore
        .collection('donations')
        .add(firedUpDonation);

      await pubsubWrite;
      await actblueFirestoreWrite;
      await firedupFirebaseWrite;

      res.status(200).send('OK');
    } catch (error) {
      console.log('Error in actblueWebhook');
      console.error(error);
      res.status(400).send(error);
    }
  } else {
    res.status(200).send('Skip');
  }
});
