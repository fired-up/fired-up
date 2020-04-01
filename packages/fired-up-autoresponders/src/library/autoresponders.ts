import auth from 'fired-up-core/src/library/auth';
import { firebase, firestore } from 'fired-up-core/src/library/firebase';

const getAutoresponder = id => {
  return new Promise((resolve, reject) => {
    if (id) {
      firestore
        .collection('autoresponders')
        .doc(id)
        .get()
        .then(doc => {
          if (doc.exists) {
            resolve(doc.data());
          } else {
            reject('Not Found');
          }
        })
        .catch(error => {
          console.error(error);
          reject();
        });
    } else {
      reject('ID required');
    }
  });
};

const getAutoresponders = () => {
  return new Promise((resolve, reject) => {
    firestore
      .collection('autoresponders')
      .get()
      .then(snapshot => {
        const autoresponders = {};

        snapshot.forEach(doc => {
          const data = doc.data();
          const autoresponder = { id: doc.id, ...data };
          autoresponders[doc.id] = autoresponder;
        });

        resolve(autoresponders);
      })
      .catch(error => {
        console.error(error);
        reject();
      });
  });
};

const writeAutoresponder = (id, fields): Promise<any | string> => {
  return new Promise((resolve, reject) => {
    const uid = auth.currentUser() ? auth.currentUser().uid : null;

    if (uid && !id) {
      const mapped = {
        ...fields,
        creator: uid,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      };

      firestore
        .collection('autoresponders')
        .add(mapped)
        .then(doc => {
          resolve({ ...mapped, id: doc.id });
        })
        .catch(error => {
          console.error(error);
          reject('Could not write data to Firestore');
        });
    } else if (uid && id) {
      getAutoresponder(id)
        .then(form => {
          // Keep existing
          const mapped = {
            ...fields,
            modified_by: uid,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
          };

          firestore
            .collection('autoresponders')
            .doc(id)
            .set(mapped, { merge: true })
            .then(() => {
              resolve({ ...form, ...mapped, id });
            })
            .catch(error => {
              console.error(error);
              reject('Could not write data to Firestore');
            });
        })
        .catch(error => {
          console.error(error);
          reject("Can't edit nonexistant autoresponder");
        });
    } else {
      reject('Unauthenticated');
    }
  });
};

/**
 * Sends a preview autoresponder
 * Only available to super admins
 * @param {string} id - Autoresponder id
 * @param {string} email - Email address to send to
 */
export const sendAutoresponder = async (id: string, email: string) => {
  const sendPreviewAutoresponder = firebase
    .functions()
    .httpsCallable('sendPreviewAutoresponder');
  try {
    const result = await sendPreviewAutoresponder({
      autoresponderID: id,
      email,
    });

    return result;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Deletes an autoresponder from Firestore
 * @param {string} id - Firestore ID of autoresponder scheduled for deletion
 */
const deleteAutoresponder = async (id: string) => {
  try {
    const result = await firestore
      .collection('autoresponders')
      .doc(id)
      .delete();

    return;
  } catch (err) {
    console.log(err);
    return err;
  }
};

export default {
  deleteAutoresponder,
  getAutoresponder,
  getAutoresponders,
  writeAutoresponder,
};
