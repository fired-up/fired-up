import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';
import {
  pipelineCreate,
  pipelineUpdate,
} from '../../../fired-up-core/functions/library/pipeline';

try {
  firebase.initializeApp();
} catch (error) {}

import pipelineUnique from './pipeline/unique-donation';
import pipelinePeopleUpsert from './pipeline/people-upsert';
import pipelineRefcodeParsing from './pipeline/refcode-parsing';
import pipelineKickbox from '../../../fired-up-signups/functions/library/pipeline/kickbox';
import pipelineDataCleanup from '../../../fired-up-signups/functions/library/pipeline/data_cleanup';
import pipelineGoogleGeocode from '../../../fired-up-signups/functions/library/pipeline/google_geocode';
import pipelineCreateFirebaseUser from '../../../fired-up-signups/functions/library/pipeline/create_firebase_user';

/**
 * This is a template of tasks to run for the signups.
 * It'll eventually be automatically generated from loaded Fired Up Plugins
 */

const pipelineTasks = {
  validate: ['unique', 'data_cleanup', 'kickbox'],
  transform: ['google_geocode', 'refcode_parsing'],
  load: ['people_upsert', 'create_firebase_user'],
};

/**
 * SignupsPipeline is an object of functions that can transform the signups
 * Each step is passed args:
 * `signup` - an instance of Firedup.Signup
 * `id` - The uid of a referred user
 */
const pipelineFunctions: FiredUp.PipelineFunctions = {
  unique: pipelineUnique,
  kickbox: pipelineKickbox,
  data_cleanup: pipelineDataCleanup,
  people_upsert: pipelinePeopleUpsert,
  google_geocode: pipelineGoogleGeocode,
  refcode_parsing: pipelineRefcodeParsing,
  create_firebase_user: pipelineCreateFirebaseUser,
};

export const donationsCreate = async snapshot => {
  return pipelineCreate(snapshot, pipelineTasks);
};

export const donationsUpdate = async (snapshot, context) => {
  return pipelineUpdate(snapshot, context, pipelineFunctions);
};

export default {
  donationsCreate,
  donationsUpdate,
};
