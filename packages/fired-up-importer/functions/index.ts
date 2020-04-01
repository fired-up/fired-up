import * as admin from 'firebase-admin';
import * as auth from 'basic-auth';
import * as functions from 'firebase-functions';

import { processImport } from './library';

const CONFIG = require('../config.json');
const firestore = admin.firestore();

const admins = {
  cloudtasks: {
    password: CONFIG.auth_password,
  },
};

export const importerCloudTasksProcessor = functions.https.onRequest(
  async (req, res) => {
    const user = auth(req);

    if (
      req.body &&
      user &&
      admins[user.name] &&
      admins[user.name].password === user.pass
    ) {
      try {
        const payload = Buffer.from(req.body, 'base64').toString('ascii');
        const data = JSON.parse(payload);

        const signup = await firestore.collection('signups').add(data);

        console.log('Imported: ', signup.id);

        res.sendStatus(200);
      } catch (error) {
        console.error(error);
        res.sendStatus(400);
      }
    } else {
      res.sendStatus(401);
    }
  }
);

export const processAdminImports = functions.firestore
  .document('imports/{docId}')
  .onCreate(processImport);
