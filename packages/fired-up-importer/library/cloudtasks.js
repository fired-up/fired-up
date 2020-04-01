const { argv } = require('yargs');

const { v2beta3 } = require('@google-cloud/tasks');
const options = {
  keyFilename: `../../key-${argv.project}.json`,
};
const cloudtasks = new v2beta3.CloudTasksClient(options);

const taskRef = cloudtasks.queuePath(
  argv.project,
  'us-central1',
  'signups-importer'
);

const addTaskToQueue = async function addTaskToQueue(task, callback) {
  try {
    const [taskResponse] = await cloudtasks.createTask({
      task,
      parent: taskRef,
    });

    //console.log(`    CREATED TASK - ${ taskResponse.name } `);

    callback();
  } catch (error) {
    //console.log(`    RETRYING ADD TASK`);

    console.log(error);

    setTimeout(() => {
      addTaskToQueue(task, callback);
    }, 1000);
  }
};

module.exports = {
  addTaskToQueue,
};
