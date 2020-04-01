import { firestore } from 'fired-up-core/src/library/firebase';
import { get as _get } from 'lodash';
import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';

export const getRecruitmentPage = async (userUid: string) => {
  try {
    const recruitmentPage = await firestore
      .collection('recruitment-pages')
      .doc(userUid)
      .get();

    if (!recruitmentPage.exists) {
      return null;
    }

    const donationDetails = await firestore
      .collection('recruitment-pages')
      .doc(userUid)
      .collection('donations')
      .get();

    return {
      ...recruitmentPage.data(),
      total_donors: donationDetails.empty ? 0 : donationDetails.size,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getUserByUid = async (uid: string): Promise<IUserWithId> => {
  const user = await firestore
    .collection('users')
    .doc(uid)
    .get();

  if (user.exists) {
    const data = user.data() as FiredUp.User;
    return {
      uid,
      ...data,
    };
  }

  return null;
};

const getUserByEmail = async (emailAddress: string) => {
  try {
    const userQuery = firestore
      .collection('users')
      .where('email_address', '==', emailAddress);
    const userQueryResult = await userQuery.limit(1).get();

    if (_get(userQueryResult.docs[0], 'ref.path')) {
      return {
        uid: userQueryResult.docs[0].id,
        ...userQueryResult.docs[0].data(),
      };
    }

    return null;
  } catch (error) {
    console.log(error);
  }
};

interface IUserWithId extends FiredUp.User {
  /**
   * Firebase User ID
   */
  uid: string;
}

/**
 * Returns user object or error message
 */
export default async (userIdentifier: string): Promise<IUserWithId> => {
  try {
    let user = await getUserByEmail(userIdentifier);

    // if at first you don't succeed, try uid...
    if (!user) {
      user = await getUserByUid(userIdentifier);
    }

    if (!user) {
      return null;
    }

    return user;
  } catch (err) {
    console.log(err);
    return err || 'Error';
  }
};
