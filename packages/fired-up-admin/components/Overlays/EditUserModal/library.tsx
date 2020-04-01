import { firebase, firestore } from 'fired-up-core/src/library/firebase';
import FiredUp from 'needtovote/typings/firedup';

/**
 * Returns void on success or error message
 * @param {string} updatingUserUid - UID of user who is updating the record
 * @param {string} userUid - UID of user (recruitment-pages document) to be updated
 * @param {object} values - Recruitment page object for updates
 */
export default async (
  updatingUserUid: string,
  userUid: string,
  values: Partial<FiredUp.RecruitmentPage>
): Promise<void | string> => {
  try {
    const valuesForUpdate = {
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_by: updatingUserUid,
      ...values,
    };
    await firestore
      .collection(`users`)
      .doc(userUid)
      .update(valuesForUpdate);

    return;
  } catch (error) {
    console.log(error);
    return 'Error';
  }
};
