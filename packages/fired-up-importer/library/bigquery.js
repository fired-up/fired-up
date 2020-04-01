const { argv } = require('yargs');

const { BigQuery } = require('@google-cloud/bigquery');

const GCP_AUTH = {
  projectId: argv.project,
  keyFilename: `../../key-${argv.project}.json`,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
};

const bigquery = new BigQuery({
  ...GCP_AUTH,
  maxRetries: 10,
});

/**
 * Get all row IDs in Bigquery for a given import for verification against CSV
 * @param {string} importID
 */
const bigqueryGetRows = async importID => {
  const query = `
        SELECT
            CAST(importer_row_id AS FLOAT64) AS importer_row_id
        FROM
            \`${argv.project}.firedup.signups\`
        WHERE
            importer_import_id = '${importID}'
        ORDER BY
            importer_row_id desc;
    `;

  try {
    const [results] = await bigquery.query(query);
    return results.map(result => result.importer_row_id);
  } catch (error) {
    throw new Error(error);
  }
};

const bigqueryCalculateNewToList = async importID => {
  const query = `
        SELECT
            COUNT(*) AS processed,
            SUM(CASE
                    WHEN created_at = ntl_time THEN 1
                    ELSE 0 END) AS ntl
        FROM
        \`${argv.project}.firedup.signups\`
        JOIN (
            SELECT
                email_address,
                created_at AS ntl_time
            FROM
                \`${argv.project}.firedup.people_min\`)
        USING
            (email_address)
        WHERE
            importer_import_id = '${importID}'
    `;

  try {
    const [results] = await bigquery.query(query);
    return results;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  bigqueryGetRows,
  bigqueryCalculateNewToList,
};
