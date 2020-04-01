import { firestore } from 'fired-up-core/src/library/firebase';

export const getSignupsByForm = async id => {
  try {
    const snapshot = await firestore
      .collection('signups')
      .where('form_id', '==', id)
      .orderBy('created_at', 'asc')
      .limit(1000)
      .get();

    const signups = [];

    snapshot.forEach(doc => {
      signups.push({ id: doc.id, ...doc.data() });
    });

    return signups;
  } catch (err) {
    console.log(err);
  }
};
