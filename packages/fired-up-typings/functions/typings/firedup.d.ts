// https://github.com/firebase/firebase-js-sdk/issues/767#issuecomment-393288325
import firebase from 'firebase/app';
import 'firebase/firestore';

export namespace FiredUp {
  interface Person {
    // Meta Fields
    created_at: firebase.firestore.Timestamp;
    updated_at: firebase.firestore.Timestamp;
    meta: any; // History of field submissions for person
    people_algo?: number; // Version of people code

    // Basic Profile Fields
    email_address: string;
    family_name?: string;
    given_name?: string;
    honorific_prefix?: string; // Mr, Mrs, Ms, etc

    // Phone number
    phone_number_number?: string; // "Offical" cleaned phone number
    phone_number_extension?: string; // extension for the phone number.
    phone_number_number_type?: string; // Phone number type (Home/work/mobile/etc)
    phone_number_sms_capable?: boolean; // SMS Opt In field

    // Address Fields
    address_line1?: string;
    address_line2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;

    // Melissa Cleaned Address Fields
    cleaned_provider?: string;
    cleaned_provider_key?: string;
    cleaned_mode?: string;
    cleaned_melissa_results?: string;
    cleaned_address_line1?: string;
    cleaned_locality?: string;
    cleaned_region?: string;
    cleaned_postal_code?: string;
    cleaned_postal_code4?: string;

    // Sendgrid Sync
    global_email_list_ids?: Array<string>; // List IDs a person is subscribed to
    sendgrid_sync_status?: number; // Sync Status for original sendgrid sync
    sendgrid_v3_sync_status?: number; // Synd Status for updated sendgrid sync

    // Intercom Sync
    intercom_interest_tags?: Array<string>;
    intercom_sync_status?: number;

    // Aggregated fields
    actions_taken?: string;
    donor_types?: string;
    submitted_forms?: string;

    // UTM Values
    source_utm_content?: string;
    source_utm_medium?: string;
    source_utm_campaign?: string;
    source_utm_term?: string;
    source_utm_source?: string;

    // Fired Up Misc
    importer_ids?: Array<string>;
    firebase_user_id?: string;
  }

  interface PersonWithId {
    id: string;
    person: Person;
  }

  interface Task {
    name: string;
    completed: boolean;
  }

  interface Lifecycle {
    lifecycle: string;
    tasks: Array<Task>;
  }

  interface TasksTemplate {
    fired_up_tasks: Array<Lifecycle>;
  }

  interface HygieneMetadata {
    kickbox_role?: string;
    kickbox_reason?: string;
    kickbox_sendex?: string;
    kickbox_disposable?: string;
    kickbox_accept_all?: string;
    kickbox_did_you_mean?: string;
  }

  interface SignupFields extends Person {
    given_name?: string;
    family_name?: string;
    email_address: string;
    phone_number?: string;
    phone_number_number?: string;
    phone_number_extension?: string;
    address_line1?: string;
    address_line2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;

    /**
     * For contact forms, topic of contact
     */
    contact_topic?: string;
    contact_message?: string;

    /**
     * Volunteer
     */
    supporter_status?: string;
    organizer_last_contacted_at?: Date;
    organizer_last_responded_at?: Date;
    organizer_last_note?: string;
    van_events?: Array<any>;
  }

  interface TaskLeases {
    [index: string]: Date;
  }

  interface SignupConfiguration {
    /**
     * Opts user in to mailing list or not. Default is usually `true`
     * but can be switched to false for things like contact forms
     */
    opt_in?: boolean;
  }

  interface Signup {
    // Common Fields
    created_at?: Date; // Comes in via some integrations as a string and we convert them to dates in the pipeline
    type?: string;
    form_id?: string;
    fields: SignupFields;
    unique_signup?: boolean; // Set via step function
    url?: string;
    utm?: UTM;

    // Step Functions
    fired_up_tasks: Array<Lifecycle>; // List of tasks and their status post-signup
    fired_up_task_leases: TaskLeases; // Ensures single execution of step functions

    // Validity
    hygiene_email_validity?: string;
    hygiene_metadata?: HygieneMetadata;

    // Misc
    chapter?: string;
    config?: SignupConfiguration;
  }

  interface Donation {
    config?: SignupConfiguration;

    /**
     * Created At comes in via some integrations as a string and we convert them to dates in the pipeline
     */
    created_at?: Date;
    fields: SignupFields;
    fired_up_task_leases: TaskLeases;
    fired_up_tasks: Array<Lifecycle>;
    form_id: string;
    hygiene_email_validity?: string;
    hygiene_metadata?: HygieneMetadata;
    type: string;
    unique_donation?: boolean;
    actblue_refcode?: string;
  }

  interface PipelineFunction {
    (
      signup: Signup,

      /**
       * Document ID of triggering action
       */
      id: string,

      /**
       * If trigger action is stored in subcollection, this is the parent collection ID
       */
      parentID?: string
    ): object;
  }

  interface PipelineFunctions {
    [index: string]: PipelineFunction;
  }

  interface Autoresponder {
    created_at: firebase.firestore.Timestamp;
    updated_at: firebase.firestore.Timestamp;
    content: string;
    name: string;
    subject: string;

    /**
     * Firebase UID of whoever created this autoresponder
     */
    creator: string;

    /**
     * Firebase UID of whoever last modified this autoresponder
     */
    modified_by: string;
  }

  interface Form {
    autoresponder_id: string;
    created_at: firebase.firestore.Timestamp;
    creator: string;
    description: string;
    id: string;
    modified_by: string;
    name: string;
    title: string;
    total_submissions: number;
    updated_at: firebase.firestore.Timestamp;
  }

  interface User {
    avatarPath?: string;
    created_at?: firebase.firestore.Timestamp;
    donors_donation_total: number;
    donors_total: number;
    email_address: string;
    family_name: string;
    given_name: string;
    last_login_at?: firebase.firestore.Timestamp;
    updated_at?: firebase.firestore.Timestamp;
    updated_by?: string;
    trainings: {
      [key: string]: boolean;
    };
  }

  interface OrganizerContact {
    contacted_by_name: string;

    /**
     * Firestore ID of organizer
     */
    contacted_by: string;
    contact_type: string;
    created_at: firebase.firestore.Timestamp;
    person_id: string;
    person_name: string;
    fields: {
      connected: 'yes' | 'no';
      email_address: string;
      organizer_notes: string;
      other_candidate: string;
      supporter_score: string;
      supporter_status: string;
    };
  }

  interface UTM {
    // UTM inside of signups. Uses @segment/utm-params
    campaign?: string;
    content?: string;
    medium?: string;
    name?: string; // @segment/utm-params calls campaign "name"
    source?: string;
    term?: string;
  }

  interface ActionSummaries {
    actions_taken: string;
    donor_types: string;
    importer_ids: Array<string>;
    origin_source: string;
    submitted_forms: string;
  }
  interface ImportRecord {
    bucket?: string;
    completed?: firebase.firestore.Timestamp;
    created_at: firebase.firestore.Timestamp;
    // Firestore ID of creator
    created_by: string;

    // Name of creator
    created_by_name: string;

    error_doc?: string;

    // name & location of file in cloud storage. aka `fullPath`
    file_name: string;
    map: Array<IMap>;

    // Optional note to describe what this import is
    note?: string;

    // 0-1 floating point representing completion progress
    percent_complete?: number;

    // Basically `any`. We leave this open-ended to allow for the importer script
    // to pull anything out of here and do what it needs to do
    settings?: LooseObject;

    // Number of records that couldn't be processed
    invalid_records: number;

    // Number of records in CSV
    total_records: number;
    utm?: {
      content?: string;
      medium?: string;
      source?: string;
      term?: string;
      name?: string;
    };
  }
}
