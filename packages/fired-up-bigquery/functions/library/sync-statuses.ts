export default {
  // Bigquery Person & Signup Sync
  BIGQUERY_SYNC_SUCCESS: 1, // Successfully synced record
  BIGQUERY_SYNC_FAILURE: 2, // Failed to sync record - Solution: resync
  BIGQUERY_SYNC_UNKNOWN: 3, // An error occured, unknown sync status - Solution: query BigQuery to verify, resync if failed
};
