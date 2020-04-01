import * as functions from 'firebase-functions';
import donationsPipeline from './library/donations-pipeline';

export const donationCreate = functions.firestore
  .document('donations/{docId}')
  .onCreate(donationsPipeline.donationsCreate);

export const donationUpdate = functions.firestore
  .document('donations/{docId}')
  .onUpdate(donationsPipeline.donationsUpdate);
