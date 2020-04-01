import * as functions from 'firebase-functions';
import signupsPipeline from './library/signups-pipeline';

export const signupCreate = functions.firestore
  .document('signups/{docId}')
  .onCreate(signupsPipeline.signupsCreate);

export const signupUpdate = functions.firestore
  .document('signups/{docId}')
  .onUpdate(signupsPipeline.signupsUpdate);
