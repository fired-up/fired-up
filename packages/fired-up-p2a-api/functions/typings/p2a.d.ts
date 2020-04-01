import { FiredUp } from '../../../fired-up-typings/typings/firedup';

export namespace P2A {
  export interface Advocate {
    /**
     * One or more campaigns to which to add this contact
     */
    campaigns: [string];

    /**
     * The contact's prefix (Mr., Mrs., Ms., Dr., etc)
     */
    prefix?: string;

    /**
     * The contact's first name
     */
    firstname?: string;

    /**
     * The contact's last name
     */
    lastname?: string;

    /**
     * The contact's email address (checked for format validity)
     * One of email or phone is required
     */
    email?: string;

    /**
     * The contact's phone number. 10 digit integer
     * One of email or phone is required
     */
    phone?: string;

    /**
     * The first line of the contact's street address (house number and street)
     * for example: 1800 Baltimore Avenue
     */
    address1?: string;

    /**
     * The contact's five-digit ZIP code
     */
    zip5?: string;

    /**
     * (legislator email campaigns only) The advocate's message to their legislator(s).
     */
    message?: string;

    /**
     * positive integer, 5 digits
     * (RSVP campaigns only) The total number of guests attending, including the person registering.
     */
    guests?: string;

    /**
     * array of strings, max 100 characters each
     * For all additional guests (beyond the person registering), the names of each.
     */
    guestNames?: [string];

    /**
     * Opts this contact in to receive future text messages.
     */
    smsOptin?: 1 | 0;

    /**
     * Opts this contact in to receive future email messages.
     */
    emailOptin?: 1 | 0;
  }

  export interface AdvocateRequest extends Partial<FiredUp.Person> {
    smsOptIn?: boolean;
    campaign_id: string;
  }

  export interface AdvocateResponse {
    advocateid: string;
    error: string;
    success: 1 | 0;
    type: string;
  }

  export interface ConnectionRequest {
    campaign_id: string;
    consId: string;
    type: 'email' | 'call';
    subject?: string;
    body?: string;
    source_utm_content?: string;
    source_utm_medium?: string;
    source_utm_campaign?: string;
    source_utm_term?: string;
    source_utm_source?: string;
  }

  export interface Connection {
    /**
     * The Phone2Action identifier for the advocate with whom the connection will be initiated.
     */
    advocateid: string;

    /**
     * The campaign via which you want this advocate's message(s) to be sent. This will also add the advocate as a member of this campaign and organization, if they aren't already.
     */
    campaignid: string;

    /**
     * One of: "tweet", "email", or "call".
     */
    type: ['tweet' | 'email' | 'call'];

    /**
     * The subject line of the email to be sent. If nothing is passed for both this value and emailMessage, the campaign's default will be used. If emailMessage is passed, subject will be blank if this value is not included.
     */
    emailSubject?: string;

    /**
     * The body of the email to be sent. If nothing is passed, the campaign's default will be used.
     * DO NOT include an introduction or signature (e.g., Dear Legislator, or Sincerely, John Doe. These will be added automatically.
     */
    emailMessage?: string;
    // tweetMessage?: string;
  }

  export interface ConnectionResponse {
    success: number;
    error?: string;
    data: {
      ids: number[];
      leg: {
        [key: string]: {
          chamber: string;
          contact_mailing_addresses?: any;
          country: string;
          district: string;
          id: number;
          level: string;
          name_first: string;
          name_full: string;
          name_last: string;
          party?: any;
          state: string;
          title: string;
          tweet_url: string;
        };
      };
      url: string;
      urls: {
        [key: string]: string;
      };
    };
  }

  export interface EmailRequestParams extends Partial<FiredUp.Person> {
    body: string;
    campaign_id: string;
    consId: string;
    smsOptin: boolean;
    subject: string;
  }

  export interface CallRequestParams extends Partial<FiredUp.Person> {
    campaign_id: string;
    consId?: string;
    smsOptin?: boolean;
  }
}
