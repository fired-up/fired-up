import * as intercom from 'intercom-client';
import * as functions from 'firebase-functions';

const client = new intercom.Client({
  token: functions.config().intercom.token,
});

const MAX_ATTEMPTS = 5;

export function retryableIntercomAssignment(assignmentOptions) {
  let attempts = 0;

  return new Promise(resolve => {
    (async function loop() {
      try {
        const result = await client.users.update(assignmentOptions);

        if (result.body.type === 'user') {
          return resolve();
        } else {
          throw new Error(result.body.errors[0]);
        }
      } catch (error) {
        if (error.statusCode === 404) {
          console.log(`retryableIntercomAssignment user not assignable`);

          return resolve();
        }

        console.log('Error', error);

        setTimeout(() => {
          console.log(
            `Retrying Intercom assignment (attempt #${attempts + 1})`
          );

          if (attempts < MAX_ATTEMPTS) {
            attempts++;
            loop();
          } else {
            console.log(
              `retryableIntercomAssignment did not succeed after ${MAX_ATTEMPTS} attempts`
            );

            resolve();
          }
        }, 1000);
      }
    })();
  });
}

export function retryableIntercomTagging(taggingOptions) {
  let attempts = 0;

  return new Promise(resolve => {
    (async function loop() {
      try {
        const result = await client.tags.tag(taggingOptions);

        if (result.body.type === 'tag') {
          return resolve();
        } else {
          throw new Error(result.body.errors[0]);
        }
      } catch (error) {
        if (error.statusCode === 404) {
          console.log(`retryableIntercomTagging user not taggable`);

          return resolve();
        }

        console.log('Error', error);

        setTimeout(() => {
          console.log(`Retrying Intercom tagging (attempt #${attempts + 1})`);

          if (attempts < MAX_ATTEMPTS) {
            attempts++;
            loop();
          } else {
            console.log(
              `retryableIntercomTagging did not succeed after ${MAX_ATTEMPTS} attempts`
            );

            resolve();
          }
        }, 1000);
      }
    })();
  });
}

export function retryableIntercomEventing(eventOptions) {
  let attempts = 0;

  return new Promise(resolve => {
    (async function loop() {
      try {
        const result = await client.events.create(eventOptions);

        if (result.statusCode === 202) {
          return resolve();
        } else {
          throw new Error('Request failed');
        }
      } catch (error) {
        if (error.body && error.body.errors) {
          for (const item of error.body.errors) {
            if (item.code === 'not_found') {
              /**
               * Intercom User doesn't yet exist
               * This creates a placeholder user that the batch sync will later fill in completely
               */
              console.log("Intercom user doesn't exist - creating placeholder");

              await retryableIntercomAssignment({
                email: eventOptions.email,
              });

              console.log('Intercom placeholder user created');
            } else if (item.code === 'parameter_not_found') {
              /**
               * Something required missing, retrying isn't going to solve the error, exit function
               */
              console.log('An event can not be created for this email');
              return resolve();
            }
          }
        }

        console.log('Error', error.body ? error.body : error);

        setTimeout(() => {
          console.log(
            `Retrying Intercom event creation (attempt #${attempts + 1})`
          );

          if (attempts < MAX_ATTEMPTS) {
            attempts++;
            loop();
          } else {
            console.log(
              `retryableIntercomEventing did not succeed after ${MAX_ATTEMPTS} attempts`
            );

            resolve();
          }
        }, 1000);
      }
    })();
  });
}

export default {
  retryableIntercomAssignment,
  retryableIntercomEventing,
  retryableIntercomTagging,
};
