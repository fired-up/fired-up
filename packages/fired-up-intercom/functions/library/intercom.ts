import * as _ from 'lodash';
import * as crypto from 'crypto';
//import { format } from 'date-fns';

import * as intercom from 'intercom-client';
import * as functions from 'firebase-functions';
//import { middleware as webhookMiddleware } from 'x-hub-signature';

const INTERCOM_HASH_KEY = functions.config().intercom.hash_key;
const INTERCOM_ASSIGNMENT_ADMIN = '';
const INTERCOM_MESSAGING_BOT = '';

const client = new intercom.Client({
  token: functions.config().intercom.token,
});

interface CustomAttributes {
  paid_subscriber: boolean;
  monthly_spend: number;
  team_mates: number;
}

interface Avatar {
  type: string;
  image_url: string;
}

interface LocationData {
  type: string;
  city_name: string;
  continent_code: string;
  country_code: string;
  country_name: string;
  latitude: number;
  longitude: number;
  postal_code?: any;
  region_name: string;
  timezone: string;
}

interface SocialProfile {
  name: string;
  id: string;
  username: string;
  url: string;
}

interface SocialProfiles {
  type: string;
  social_profiles: SocialProfile[];
}

interface Company {
  id: string;
}

interface Companies {
  type: string;
  companies: Company[];
}

interface Segment {
  id: string;
}

interface Segments {
  type: string;
  segments: Segment[];
}

interface Tag {
  id: string;
}

interface Tags {
  type: string;
  tags: Tag[];
}

interface IntercomUser {
  type: string;
  id: string;
  user_id: string;
  email: string;
  phone: string;
  name: string;
  updated_at: number;
  last_seen_ip: string;
  unsubscribed_from_emails: boolean;
  last_request_at: number;
  signed_up_at: number;
  created_at: number;
  session_count: number;
  user_agent_data: string;
  pseudonym?: any;
  anonymous: boolean;
  custom_attributes: CustomAttributes;
  avatar: Avatar;
  location_data: LocationData;
  social_profiles: SocialProfiles;
  companies: Companies;
  segments: Segments;
  tags: Tags;
}

/*interface Author {
  type: string;
  id: string;
  name: string;
  email: string;
  companies: any[];
}

interface User {
  type: string;
  id: string;
}

interface IntercomNote {
  type: string;
  id: string;
  created_at: number;
  body: string;
  author: Author;
  user: User;
}

interface IntercomError {
  code: string;
  message: string;
}

interface IntercomMessage {
  type: string;
  id: string;
  created_at: number;
  body: string;
  message_type: string;
}*/

type IntercomUserData = {
  email: string;
  user_id?: string;
  phone?: string;
  signed_up_at: string | number;
  name?: string;
  custom_attributes?: {
    entry_point?: string;
    region?: string;
    postal_code?: string;
    url?: string;
    firstname?: string;
    lastname?: string;
  };
};

/**
 * Find, or create if non-existent, a user in Intercom by email address
 * @param {string} email Email address for a user
 * @param {object} userData - Intercom-formatted data
 * @returns {object} IntercomUser
 */
export const findOrCreateUserByEmail = async (
  email: string,
  userData?: IntercomUserData
): Promise<IntercomUser> => {
  try {
    let intercomUserData = { email };

    if (userData) {
      intercomUserData = Object.assign({}, { email }, userData);
    }

    console.log(`Creating or updating intercom user with email: ${email}`);
    const result = await client.users.create(intercomUserData);

    return result.body.type === `user` ? result.body : result.body.errors[0];
  } catch (error) {
    console.error(error);
    return error;
  }
};

/**
 * Create an event for an already-existing user in Intercom
 * @param {string} email - An Intercom user's ID
 * @param {string} event_name - Name of an event
 */
/*export const createIntercomEvent = async (
  email: string,
  event_name: string
) => {
  try {
    console.log(
      `createIntercomEvent ${event_name} for user with email: ${email}`
    );
    const result = await client.events.create({
      created_at: parseInt(format(new Date(), 'X')),
      event_name,
      email,
    });

    return;
  } catch (err) {
    console.log(err.body);

    return err;
  }
};*/

/**
 * Generates a hash for usage on Intercom
 * https://www.intercom.com/help/configure-intercom-for-your-product-or-site/staying-secure/enable-identity-verification-on-your-web-product
 * @param uid - Firebase user UID
 * @returns {string} - HMAC
 */
export const generateHashFromUid = (uid: string): string => {
  const hash = crypto
    .createHmac('sha256', INTERCOM_HASH_KEY)
    .update(uid)
    .digest('hex');

  return hash;
};

export const createContactFormMessage = async (
  recipientID: string,
  email_address: string,
  given_name: string,
  family_name: string,
  contact_message: string
) => {
  const name = `${given_name} ${family_name}`;

  try {
    const leadResponse: any = await new Promise((resolve, reject) => {
      client.leads.create({ email: email_address, name }, (error, response) =>
        error ? reject(error) : resolve(response)
      );
    });

    const { id: contactID } = leadResponse.body;

    const message = {
      body: contact_message,
      from: {
        type: 'contact',
        id: contactID,
      },
    };

    const messageResponse: any = await new Promise((resolve, reject) => {
      client.messages.create(message, (error, response) =>
        error ? reject(error) : resolve(response)
      );
    });

    const { id: messageID } = messageResponse.body;

    const conversationsResponse: any = await new Promise((resolve, reject) => {
      client.conversations.list(
        { type: 'user', intercom_user_id: contactID },
        (error, response) => (error ? reject(error) : resolve(response))
      );
    });

    const { conversations } = conversationsResponse.body;
    const conversationID = conversations[0].id;

    const reply = {
      type: 'admin',
      id: conversationID,
      assignee_id: recipientID,
      message_type: 'assignment',
      admin_id: INTERCOM_ASSIGNMENT_ADMIN,
    };

    const assignmentResponse: any = await new Promise((resolve, reject) => {
      client.conversations.reply(reply, (error, response) =>
        error ? reject(error) : resolve(response)
      );
    });
  } catch (error) {
    console.error(error && error.body ? error.body : error);
  }

  return;
};

export const createVolunteerInitiatedMessage = async (
  recipient_id: string,
  contact_message: string
) => {
  try {
    const messageResponse = await client.messages.create({
      body: contact_message,
      from: {
        type: 'user',
        user_id: INTERCOM_MESSAGING_BOT,
      },
    });

    const { id: messageID } = messageResponse.body;

    const conversationsResponse = await client.conversations.list({
      type: 'user',
      user_id: INTERCOM_MESSAGING_BOT,
    });

    const { conversations } = conversationsResponse.body;
    const conversationID = conversations[0].id;

    const assignmentResponse = await client.conversations.reply({
      type: 'admin',
      id: conversationID,
      assignee_id: recipient_id,
      message_type: 'assignment',
      admin_id: INTERCOM_ASSIGNMENT_ADMIN,
    });

    console.log('createVolunteerInitiatedMessage completed');
  } catch (error) {
    console.error(error && error.body ? error.body : error);
  }

  return;
};

export default {
  generateHashFromUid,
  findOrCreateUserByEmail,
  createContactFormMessage,
  createVolunteerInitiatedMessage,
};
