import auth from 'fired-up-core/src/library/auth';
import { firebase, firestore } from 'fired-up-core/src/library/firebase';

const getForm = id => {
  return new Promise((resolve, reject) => {
    if (id) {
      firestore
        .collection('forms')
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

const getForms = async () => {
  try {
    const res = await firestore.collection('forms').get();
    const forms = {};
    res.forEach(doc => {
      const data = doc.data();
      const form = Object.assign({}, data, {
        id: doc.id,
        created_at: data.created_at ? data.created_at.toDate() : null,
        updated_at: data.updated_at ? data.updated_at.toDate() : null,
      });
      forms[doc.id] = form;
    });

    return forms;
  } catch (err) {
    return err;
  }
};

const writeForm = (id, fields) => {
  return new Promise((resolve, reject) => {
    const uid = auth.currentUser() ? auth.currentUser().uid : null;

    if (uid && !id) {
      const mapped = Object.assign({}, fields, {
        total_submissions: 0,
        creator: uid,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      });

      firestore
        .collection('forms')
        .add(mapped)
        .then(doc => {
          resolve(Object.assign({}, mapped, { id: doc.id }));
        })
        .catch(error => {
          console.error(error);
          reject('Could not write data to Firestore');
        });
    } else if (uid && id) {
      getForm(id)
        .then(form => {
          // Keep existing
          const mapped = Object.assign({}, fields, {
            modified_by: uid,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
          });

          firestore
            .collection('forms')
            .doc(id)
            .set(mapped, { merge: true })
            .then(() => {
              resolve(Object.assign({}, form, mapped, { id }));
            })
            .catch(error => {
              console.error(error);
              reject('Could not write data to Firestore');
            });
        })
        .catch(error => {
          console.error(error);
          reject("Can't edit nonexistant form");
        });
    } else {
      reject('Unauthenticated');
    }
  });
};

export default {
  getForm,
  getForms,
  writeForm,
};
