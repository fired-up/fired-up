import * as axios from 'axios';
import * as functions from 'firebase-functions';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { every as _every, isEmpty as _isEmpty } from 'lodash';

const phoneUtil = PhoneNumberUtil.getInstance();

import { P2A } from '../typings/p2a';
import { FiredUp } from '../../../fired-up-typings/typings/firedup';

const auth = {
  username: functions.config().p2a.api,
  password: functions.config().p2a.secret,
};

const osdiToP2A = (args: Partial<FiredUp.Person>): Partial<P2A.Advocate> => {
  const number = phoneUtil.parseAndKeepRawInput(args.phone_number, 'US');

  return {
    ...(args.given_name && { firstname: args.given_name }),
    ...(args.family_name && { lastname: args.family_name }),
    ...(args.postal_code && { zip5: args.postal_code }),
    ...(args.address_line1 && { address1: args.address_line1 }),
    ...(args.email_address && { email: args.email_address }),
    ...(args.honorific_prefix && { prefix: args.honorific_prefix }),
    ...(args.phone_number && { phone: `${number.getNationalNumber()}` }),
    ...(args.source_utm_content && { utm_content: args.source_utm_content }),
    ...(args.source_utm_medium && { utm_medium: args.source_utm_medium }),
    ...(args.source_utm_campaign && { utm_campaign: args.source_utm_campaign }),
    ...(args.source_utm_term && { utm_term: args.source_utm_term }),
    ...(args.source_utm_source && { utm_source: args.source_utm_source }),
  };
};

const p2aRequestInstance = axios.create({
  auth,
  baseURL: 'https://api.phone2action.com/2.0'
});

/**
 * Requires one of email_address or phone_number
 * Creates or updates a contact under your Phone2Action account
 * and (optionally) assign it a campaign.
 * @returns {string} - Advocate ID
 */
const createAdvocateRequest = async (req: P2A.AdvocateRequest) => {
  console.log('Creating advocate request');
  try {
    const hasEmailOrPhone = !!req.email_address || !!req.phone_number;
    const baselineProps = [
      req.postal_code,
      req.email_address,
      req.address_line1,
      req.campaign_id,
      hasEmailOrPhone,
    ];

    if (!_every(baselineProps)) {
      throw {
        msg: 'Insufficient props supplied to createAdvocateRequest',
      };
    }

    const contact: P2A.Advocate = {
      ...osdiToP2A(req),
      campaigns: [req.campaign_id],
      smsOptin: req.smsOptIn ? 1 : 0,
    };

    const response = await p2aRequestInstance.post<P2A.AdvocateResponse>(
      '/advocates',
      contact
    );

    if (response.data.success === 1) {
      return response.data.advocateid;
    }

    throw {
      msg: 'Unable to create',
    };
  } catch (err) {
    const requestError: axios.AxiosError = err;
    throw {
      msg: requestError.response.data.error,
    };
  }
};

/**
 * This endpoint will initiate a connection with a legislator (or legislators) for a given advocate. You'll need to specify which type(s) of connection(s) to initiate, from the following:
 * Email: will send an email message to the officials assigned through the campaign, and will return a success message with the legislators' information and message sent.
 * Call: will immediately intiate a call to the advocate's phone, and will return a success message with the legislators' information.
 */
const createConnectionRequest = async (
  req: P2A.ConnectionRequest
): Promise<P2A.ConnectionResponse> => {
  console.log('Creating P2A connection request');
  try {
    const requestBody: P2A.Connection = {
      advocateid: req.consId,
      campaignid: req.campaign_id,
      type: [req.type],
      ...(req.source_utm_content && { utm_content: req.source_utm_content }),
      ...(req.source_utm_medium && { utm_medium: req.source_utm_medium }),
      ...(req.source_utm_campaign && { utm_campaign: req.source_utm_campaign }),
      ...(req.source_utm_term && { utm_term: req.source_utm_term }),
      ...(req.source_utm_source && { utm_source: req.source_utm_source }),
    };

    if (req.type === 'email') {
      requestBody.emailSubject = req.subject;
      requestBody.emailMessage = req.body;
    }

    const response = await p2aRequestInstance.post<P2A.ConnectionResponse>(
      '/connections',
      requestBody
    );
    if (response.data.success === 1) {
      return response.data;
    }

    throw {
      msg: `Unable to create ${req.type} request`,
    };
  } catch (err) {
    const requestError: axios.AxiosError = err;
    throw {
      msg: requestError.response.data.error,
    };
  }
};

export const sendEmail = async (req: P2A.EmailRequestParams) => {
  console.log('Attempting P2A sendEmail');
  const baselineProps = [
    'address_line1',
    'body',
    'campaign_id',
    'email_address',
    'postal_code',
    'subject',
  ];
  let missingProps = [];
  baselineProps.forEach(prop => !req[prop] && missingProps.push(prop));
  // Ensure we have baseline props
  if (!_isEmpty(missingProps)) {
    throw {
      msg: `Insufficient props supplied to sendEmail. Required: ${missingProps.join(
        ', '
      )}`,
    };
  }

  try {
    // If no consId, get it.
    const advocateId = req.consId
      ? req.consId
      : await createAdvocateRequest(req);
    const result: P2A.ConnectionResponse = await createConnectionRequest({
      ...req,
      consId: advocateId,
      type: 'email',
    });

    return result.data;
  } catch (err) {
    throw err;
  }
};

export const createCall = async (req: P2A.CallRequestParams) => {
  try {
    // Ensure we have the baseline props, at least
    const baselineProps = [
      'address_line1',
      'campaign_id',
      'email_address',
      'postal_code',
      'phone_number',
    ];
    let missingProps = [];
    baselineProps.forEach(prop => !req[prop] && missingProps.push(prop));
    if (!_isEmpty(missingProps)) {
      throw {
        msg: `Insufficient props supplied to createCall. Required: ${missingProps.join(
          ', '
        )}`,
      };
    }

    // If no consId, get it.
    const advocateId = req.consId
      ? req.consId
      : await createAdvocateRequest(req);

    const result: P2A.ConnectionResponse = await createConnectionRequest({
      ...req,
      consId: advocateId,
      type: 'call',
    });

    return result.data;
  } catch (err) {
    throw {
      msg: err,
    };
  }
};
