import firebase from 'firebase-admin';

const firestore = firebase.firestore();

/**
 * Ensure a user is an admin
 * @param {object} - A user's context
 * @returns {boolean} - True if user is admin, false if not
 */
export const verifySuperAdminStatus = context => {
  if (
    typeof context.auth === 'object' &&
    context.auth.token.role &&
    context.auth.token.role === 'super-admin'
  ) {
    return true;
  }

  return false;
};

/**
 * Gets
 * @param {string} userId - A firebase user's UID
 * @returns {object} - Record from /users collection
 */
export const getUserData = async (userId: string) => {
  try {
    const result = await firestore
      .collection('users')
      .doc(userId)
      .get();

    if (!result.exists) {
      return { error: 'does_not_exist' };
    }

    return result.data();
  } catch (err) {
    throw new Error(err);
  }
};
