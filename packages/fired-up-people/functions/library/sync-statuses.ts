export default {
  // Bigquery Person & Signup Sync
  BIGQUERY_SYNC_SUCCESS: 1, // Successfully synced record
  BIGQUERY_SYNC_FAILURE: 2, // Failed to sync record - Solution: resync
  BIGQUERY_SYNC_UNKNOWN: 3, // An error occured, unknown sync status - Solution: query BigQuery to verify, resync if failed

  // Sendgrid Contact Sync
  SENDGRID_SYNC_SUCCESS: 1, // Successfully synced record or record doesn't need sync
  SENDGRID_SYNC_FAILED_INITIALLY: 2, // Failed to sync NEW record - Solution: resync
  SENDGRID_SYNC_FAILED_UPDATE: 3, // Failed to sync changes to EXISTING record - Solution: resync
  SENDGRID_SYNC_DISABLED: 4, // Email is unsubscribed, ignore this resource for syncing

  // Autoresponder Statuses
  SENDGRID_SENT: 1, // Sent the autoresponder
  SENDGRID_NOT_SENT_DISABLED: 2, // No autoresponder setup for form
  SENDGRID_NOT_SENT_DUPLICATE: 3, // Email is not unique to form
  SENDGRID_NOT_SENT_UNIQUENESS_UNCLEAR: 4, // Due to JS error, could not determine if email was unique - not sent

  // Intercom Sync Statuses
  INTERCOM_SYNC_SUCCESS: 1,
  INTERCOM_SYNC_QUEUED_INITIALLY: 2,
  INTERCOM_SYNC_QUEUED_UPDATE: 3,
  INTERCOM_SYNC_DISABLED: 4,
};
