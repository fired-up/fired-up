// Schema derived from http://opensupporter.github.io/osdi-docs/forms.html
// name
// content
// creator

import * as firebase from 'firebase-admin';

const firestore = firebase.firestore();

export const getAutoresponder = id => {
  return new Promise((resolve, reject) => {
    if (id) {
      firestore
        .collection('autoresponders')
        .doc(id)
        .get()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data();
            data.id = id;
            resolve(data);
          } else {
            reject('Autoresponder Not Found');
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

export default {
  getAutoresponder,
};
