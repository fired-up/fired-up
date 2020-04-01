const { argv } = require('yargs');

const firebase = require('firebase-admin');

firebase.initializeApp({
  credential: firebase.credential.cert(
    require(`../../../key-${argv.project}.json`)
  ),
  databaseURL: `https://${argv.project}.firebaseio.com`,
});

const firestore = firebase.firestore();
firestore.settings({ timestampsInSnapshots: true });

/**
 * Get a collection of imported signups from Firestore for observation
 * @param {array<int>} rowIDs
 */
const firestoreGetRow = async (importID, rowID) => {
  try {
    const snapshot = await firestore
      .collection('signups')
      //.where('importer.import_id', '==', importID)
      .where('importer.row_id', '==', Number(rowID))
      .get();

    if (snapshot.docs.length > 0) {
      return snapshot.docs[0].data();
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  firestoreGetRow,
};
