import * as functions from 'firebase-functions';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';

//const postStatusSlack = require('../_shared/slack.js');

const storage = new Storage();
const bigquery = new BigQuery();

exports.bigqueryBackup = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    const backups = [
      {
        dataset: 'firedup',
        table: 'people',
      },
      {
        dataset: 'firedup',
        table: 'signups',
      },
      {
        dataset: 'firedup',
        table: 'firebase_users',
      },
      {
        dataset: 'Sendgrid',
        table: 'emails_clicked',
      },
      {
        dataset: 'Sendgrid',
        table: 'emails_sent',
      },
      {
        dataset: 'Sendgrid',
        table: 'emails_opened',
      },
      {
        dataset: 'Sendgrid',
        table: 'emails_unsubscribed',
      },
    ];

    const timestamp = new Date().toISOString();

    try {
      for (const i in backups) {
        const item = backups[i];
        const dataset = bigquery.dataset(item.dataset);
        const table = dataset.table(item.table);

        const path = storage
          .bucket(functions.config().firedup.backups_bucket)
          .file(
            `bigquery/backup-${timestamp}/${item.dataset}-${item.table}/*.json`
          );

        console.log(`Backup Queued ${item.dataset}-${item.table}`);

        try {
          await new Promise((resolve, reject) => {
            table.extract(path, (error, response) => {
              if (error) {
                reject(error);
              } else {
                console.log(`Backup Complete ${item.dataset}-${item.table}`);

                resolve();
              }
            });
          });
        } catch (error) {
          console.log(`Whoops! Can't backup ${item.dataset}-${item.table}`);
        }
      }

      //postStatusSlack('Backup BigQuery', 'success');
    } catch (error) {
      //postStatusSlack('Backup BigQuery', 'error', error.message);
      console.error(error);
    }

    return true;
  });
