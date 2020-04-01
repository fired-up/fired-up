import * as firebase from 'firebase-admin';

import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';
import {
  pipelineCreate,
  pipelineUpdate,
} from '../../../fired-up-core/functions/library/pipeline';

try {
  firebase.initializeApp();
} catch (error) {}


/**
 * Functions that can transform the signups
 * Each function will receive args:
 * `signup` - an instance of Firedup.Signup
 * `id` - The signup's reference ID
 */
const pipelineFunctions: FiredUp.PipelineFunctions = {
  bigquery: require('./pipeline/bigquery').default,
  create_firebase_user: require('./pipeline/create_firebase_user').default,
  data_cleanup: require('./pipeline/data_cleanup').default,
  email_autoresponder: require('./pipeline/email_autoresponder').default,
  google_geocode: require('./pipeline/google_geocode').default,
  increment_counter: require('./pipeline/increment_counter').default,
  kickbox: require('./pipeline/kickbox').default,
  people_upsert: require('./pipeline/people_upsert').default,
  unique: require('./pipeline/unique').default,
};

/**
 * Baseline template of tasks that will run for a signup
 * This pipeline can be further customized by passing an array
 * of tasks in a `custom_tasks` array attached to a signup.
 * Each task listed in `custom_tasks` must first be declared in
 * `pipelineFunctions` above.
 */
const pipelineTasks = {
  validate: ['unique', 'build_config', 'kickbox'],
  transform: ['data_cleanup', 'google_geocode'],
  load: [
    'people_upsert',
    'bigquery',
    'email_autoresponder',
    'increment_counter'
  ],
};

export const signupsCreate = async snapshot => {
  return pipelineCreate(snapshot, pipelineTasks);
};

export const signupsUpdate = async (snapshot, context) => {
  return pipelineUpdate(snapshot, context, pipelineFunctions);
};

export default {
  signupsCreate,
  signupsUpdate,
};
