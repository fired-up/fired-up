//
// Pipeline.ts
// This contains functions that create, manage, and execute Pipeline tasks
//

import { findIndex as _findIndex } from 'lodash';
import * as firebase from 'firebase-admin';
import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';

try {
  firebase.initializeApp();
} catch (error) {}

const firestore = firebase.firestore();

/**
 * Generate a Tasks Template to add to the new item for
 * determining which jobs should run and keeping track of their progress
 * @param jobs
 */
const generateTasksTemplate = (
  jobs: Object,
  custom_jobs?: Array<String>
): FiredUp.TasksTemplate => {
  const fired_up_tasks = [];
  const keys = Object.keys(jobs);

  for (const key of keys) {
    for (const job of jobs[key]) {
      let lifecycleIndex = _findIndex(fired_up_tasks, ['lifecycle', key]);

      if (lifecycleIndex === -1) {
        fired_up_tasks.push({
          lifecycle: key,
          tasks: [],
        });

        lifecycleIndex = fired_up_tasks.length - 1;
      }

      fired_up_tasks[lifecycleIndex].tasks.push({
        name: job,
        completed: false,
      });
    }
  }

  if (Array.isArray(custom_jobs) && custom_jobs.length > 0) {
    for (const job of custom_jobs) {
      let lifecycleIndex = _findIndex(fired_up_tasks, [
        'lifecycle',
        'custom_tasks',
      ]);

      if (lifecycleIndex === -1) {
        fired_up_tasks.push({
          lifecycle: 'custom_tasks',
          tasks: [],
        });

        lifecycleIndex = fired_up_tasks.length - 1;
      }

      fired_up_tasks[lifecycleIndex].tasks.push({
        name: job,
        completed: false,
      });
    }
  }

  return {
    fired_up_tasks,
  };
};

/**
 * Get the next task to run for a given document
 * @param {array} firedUpTasks - An array of Lifecycle tasks to execute for this item
 */
const getNextTask = (firedUpTasks: Array<FiredUp.Lifecycle>) => {
  for (const i in firedUpTasks) {
    const tasks: Array<FiredUp.Task> = firedUpTasks[i].tasks;

    for (const j in tasks) {
      const task: FiredUp.Task = firedUpTasks[i].tasks[j];
      const { name, completed } = task;

      if (!completed) {
        return {
          task: name,
          task_index: j,
          lifecycle_index: i,
          lifecycle: firedUpTasks[i].lifecycle,
        };
      }
    }
  }

  return null;
};

/**
 * Create a _lease_ against a item's task to ensure duplicate function executions don't try to run things twice
 * Taken directly from https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions
 * TODO: Can be used for any pipeline
 * @param {DocumentReference} itemRef - Firestore ref for the item that's processing
 * @param {string} taskName - Name of the task that's executing
 * @param {string} lifecycleIndex - Array index of the lifecycle in the items lifecycle object
 * @param {string} taskIndex - Array index of the task within the lifecycle object
 */
const verifyIdempotentLease = (
  ref: firebase.firestore.DocumentReference,
  taskName: string,
  lifecycleIndex: string,
  taskIndex: string
): Promise<boolean> => {
  const LEASE_TIME = 120 * 1000; // 120s

  return firestore.runTransaction(
    (transaction: firebase.firestore.Transaction) => {
      return transaction
        .get(ref)
        .then((snapshot: firebase.firestore.DocumentSnapshot) => {
          const item: any = snapshot.data();

          if (
            snapshot.exists &&
            item.fired_up_tasks[lifecycleIndex].tasks[taskIndex].completed
          ) {
            return false;
          }

          if (
            snapshot.exists &&
            item.fired_up_task_leases &&
            item.fired_up_task_leases[taskName] &&
            new Date() < item.fired_up_task_leases[taskName]
          ) {
            Promise.reject('Lease already taken, try later.');
            return false;
          }

          // Set the lease time in object
          const lease = new Date(new Date().getTime() + LEASE_TIME);

          if (!item.fired_up_task_leases) {
            item.fired_up_task_leases = {};
          }

          item.fired_up_task_leases[taskName] = lease;

          transaction.set(
            ref,
            { fired_up_task_leases: item.fired_up_task_leases },
            { merge: true }
          );

          return true;
        });
    }
  );
};

/**
 * Firebase Functions Firestore onCreate Trigger for items
 * @param {DocumentSnapshot} snapshot - From Firebase Functions Firestore onCreate Event
 */
export const pipelineCreate = async (
  snapshot: firebase.firestore.DocumentSnapshot,
  tasks: Object
): Promise<any> => {
  const signup = snapshot.data();
  const pipelineTasks: FiredUp.TasksTemplate = generateTasksTemplate(
    tasks,
    signup.fired_up_custom_tasks
  );

  return snapshot.ref.set(
    {
      ...pipelineTasks,
      processing_started_at: new Date(),
      processing_completed_at: false,
    },
    { merge: true }
  );
};

/**
 * Firebase Functions Firestore onChange Trigger for items
 * @param {DocumentSnapshot} snapshot - From Firebase Functions Firestore onCreate Event
 * @param {object} context - From Firebase Functions Firestore onCreate Event
 */
export const pipelineUpdate = async (
  snapshot,
  context,
  pipelineFunctions: FiredUp.PipelineFunctions
) => {
  // We use Firebase functions retries but if a function isn't resolved within 10 minutes, abort it to keep from running forever.
  if (true) {
    const isEqual = require('lodash/isEqual');
    const after = snapshot.after.data();
    const before = snapshot.before.data();

    // Changed data will be stored here
    let transformedObject = {
      fired_up_tasks: after.fired_up_tasks,
    };

    // Determine if we're receiving a change to the fired_up_tasks object
    const tasksChanged = !isEqual(before.fired_up_tasks, after.fired_up_tasks);

    // Run the next task
    if (tasksChanged) {
      // Determine next task from the fired_up_tasks object
      const next = getNextTask(after.fired_up_tasks);

      // If a task is available, run it
      if (next) {
        const task = next.task;

        // Check the pipelineFunctions for presense of this task
        if (
          pipelineFunctions[task] &&
          typeof pipelineFunctions[task] === 'function'
        ) {
          const taskHasNotPreviouslyExecuted: boolean = await verifyIdempotentLease(
            snapshot.after.ref,
            task,
            next.lifecycle_index,
            next.task_index
          );

          if (taskHasNotPreviouslyExecuted) {
            console.log(
              `Running pipelineUpdate [${task} task] ${context.params.docId}...`
            );

            try {
              // Run the function for this task, and get relevant changes
              const result = await pipelineFunctions[task](
                after,
                context.params.docId,
                context.params.parentId
              );

              if (result === Object(result) && Object.keys(result).length > 0) {
                console.log('Transformed item includes changes');
                transformedObject = { ...transformedObject, ...result };
              } else {
                //console.log('Transformations not found');
                //console.log('Result', result);
              }
            } catch (error) {
              // TODO: throw error here so Firebase re-runs the function
              throw new Error(error);
            }
          } else {
            // We'll want to re-queue this item for processing
            throw new Error(
              `${task} has previously ran or is currently running for ${context.params.docId}, skipping...`
            );
          }
        }

        // Somewhat sloppy way of setting the task to completed so the next one will execute
        transformedObject.fired_up_tasks[next.lifecycle_index].tasks[
          next.task_index
        ].completed = true;

        // console.log(
        //   'writing transformed item',
        //   JSON.stringify(transformedDoc, null, 2)
        // );

        // Set the transformed item in Firestore
        return await snapshot.after.ref.set(transformedObject, { merge: true });
      }

      console.log('pipelineUpdate Pipeline complete');

      return await snapshot.after.ref.set(
        {
          //fired_up_task_leases: null,
          processing_completed_at: new Date(),
        },
        { merge: true }
      );
    } else {
      // Ignore this change as it's not task related
      return true;
    }
  } else {
    console.error(
      `Error: processing ${context.params.docId} failed - an error that was not automatically recoverable was encountered`
    );

    return true;
  }
};

export default {
  pipelineCreate,
};
