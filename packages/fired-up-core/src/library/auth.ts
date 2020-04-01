import randomize from 'randomatic';

import { getGeoFromZip } from 'fired-up-forms/src/library/utils';
import firebase, { firestore } from './firebase';

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
 * @param {string} input
 */
const b64DecodeUnicode = input => {
  // Google uses a URL friendly Base64 encoder which adds -_ which need to be replaced with +/
  input = input.replace(/-/g, '+');
  input = input.replace(/_/g, '/');

  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    atob(input)
      .split('')
      .map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
};

/**
 * Status is NOT a promise as the callback is executed each time status changes
 * This is useful when properly binded to Redux store as it updates the button on logout for us
 */
export const status = callback => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      callback(user);
    } else {
      // User is logged out
      callback(false);
    }
  });
};

/**
 * Returns a user's role from Firebase. Defaults to 'user'
 * @returns {object} - User role
 */
const getUserRole = (): Promise<{
  provider: 'google.com' | string;
  role: 'super-admin' | 'user';
}> => {
  return new Promise((resolve, reject) => {
    firebase
      .auth()
      .currentUser.getIdToken()
      .then(token => {
        const payload = JSON.parse(b64DecodeUnicode(token.split('.')[1]));
        resolve({
          provider: payload.firebase.sign_in_provider,
          role: payload.role || 'user',
        });
      })
      .catch(error => {
        console.error(error);
        reject();
      });
  });
};

/**
 * currentUser is a sync function for determining if we are logged in. Needs a few seconds after
 * firebase.init to work properly. Use auth.status if you need an immediate result
 * @returns {object} - Instance of firebase.User
 */
export const currentUser = (): firebase.User => {
  return firebase.auth().currentUser;
};

/**
 * Runs segment and other analytics calls after a user logs in
 * @param {object} user
 */
const trackLogin = async user => {
  const generateIntercomHash = await firebase
    .functions()
    .httpsCallable('generateIntercomHash');

  if (typeof analytics === 'undefined') {
    return;
  }

  const { data } = await generateIntercomHash();
  return analytics.identify(
    user.uid,
    {
      email: user.email,
    },
    {
      Intercom: {
        user_hash: data.hash,
      },
    }
  );
};

/**
 * Google login with short session timeout. Logged-in status expires when session ends
 */
const login = async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.SESSION);
    const res = await firebase.auth().signInWithPopup(provider);

    return res.user;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * If the user is supposed to be a superadmin, we need to refresh their session after key is added
 * This is specifically for admin pages and should not be used for end-user facing code
 */
const authElevationListener = (user, callback) => {
  const unsubscribe = firestore
    .collection('metadata')
    .doc(user.uid)
    .onSnapshot(() => {
      // Stop listening to metadata
      unsubscribe();

      // Force refresh of Firebase User from server
      user.getIdToken(true).then(() => {
        callback();
      });
    });
};

/**
 * Logs a user out of Firebase
 */
const logout = () => {
  return new Promise((resolve, reject) => {
    firebase
      .auth()
      .signOut()
      .then(
        () => {
          resolve();
        },
        () => {
          reject();
        }
      );
  });
};

/**
 * Create a user with email and password. Upon doing this, user will be immediately signed in.
 * @param {string} email
 * @param {string} password
 * @returns {Promise} - Resolves with firebase.auth.UserCredential, rejects with error otherwise
 */
export const createUserWithEmailAndPassword = (
  email: string,
  password: string
) => {
  return new Promise((resolve, reject) => {
    return firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(credential => {
        resolve(credential);
      })
      .catch(error => {
        if (error) {
          // var errorCode = error.code;
          // var errorMessage = error.message;

          // @todo tracking
          console.error(error.code);
          reject(error.code);
        }
      });
  });
};

/**
 * Upgrade an anonymous user via email/pass.
 * @param {string} - user's email address
 * @param {string} - user's password
 */
const upgradeAnonymousUserWithEmail = (email, password) => {
  const credential = firebase.auth.EmailAuthProvider.credential(
    email,
    password
  );

  if (!credential) {
    return new Error('No existing credentials');
  }

  return upgradeAnonymousUser(credential);
};

/**
 * Upgrades an anonymous user with email and password
 * @param {object} credential - A credential gained from email/pass, fb login, etc.
 */
const upgradeAnonymousUser = credential => {
  return new Promise((resolve, reject) => {
    firebase
      .auth()
      .currentUser.linkAndRetrieveDataWithCredential(credential)
      .then(
        usercred => {
          const user = usercred.user;
          resolve(user);
        },
        error => {
          reject(error.code);
        }
      );
  });
};

/**
 * Creates or updates a user with provided userData
 * @param userId {string} - an authenticated user's firebase user ID. can be derived from an anonymous user
 * @param userData {object}
 */
export const createOrUpdateUserData = async (userId: string, userData: any) => {
  /**
   * Removes empty (null/undefined) attributes from object
   * Source: https://stackoverflow.com/a/38340730/628699
   */
  const removeEmpty = obj => {
    const o = JSON.parse(JSON.stringify(obj)); // Clone source oect.

    Object.keys(o).forEach(key => {
      if (o[key] && typeof o[key] === 'object') o[key] = removeEmpty(o[key]);
      // Recurse.
      else if (o[key] === undefined || o[key] === null) delete o[key];
      // Delete undefined and null.
      else o[key] = o[key]; // Copy value.
    });

    return o; // Return new object.
  };

  try {
    let formattedData = userData;

    if (
      (!formattedData.latitude || !formattedData.longitude) &&
      formattedData.postal_code
    ) {
      const geoData = await getGeoFromZip(formattedData.postal_code);
      formattedData = Object.assign({}, formattedData, geoData);
    }

    await firestore
      .collection('users')
      .doc(userId)
      .set(
        Object.assign({}, removeEmpty(formattedData), {
          updated_at: firebase.firestore.FieldValue.serverTimestamp(),
          created_at: formattedData.created_at
            ? formattedData.created_at
            : firebase.firestore.FieldValue.serverTimestamp(),
        }),
        { merge: true }
      );
  } catch (err) {
    throw new Error(err.code);
  }
};

/**
 * Provides functionality to login with GoogleAuthProvider with email-only scope
 * https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider
 */
export const loginWithGoogle = () => {
  return new Promise(resolve => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(resolve)
      .catch(err => {
        console.log(err);
      });
  });
};

/**
 * Registers a user anonymously. Ensures user isn't already logged in
 */
export const registerAnonUser = () => {
  return new Promise((resolve, reject) => {
    // Ensure user isn't logged in already
    if (firebase.auth().currentUser) {
      return resolve();
    }

    return firebase
      .auth()
      .signInAnonymously()
      .catch(error => {
        console.log(error.code, error.message);
        reject(error.code);
      });
  });
};

/**
 * Retrieve current user's data from the `/users` collection
 * @returns {object} - User's profile information
 */
export const getUserData = async () => {
  const { uid } = firebase.auth().currentUser;
  try {
    const user = await firestore
      .collection('users')
      .doc(uid)
      .get();

    if (user.exists) {
      return user.data();
    }

    return null;
  } catch (err) {
    if (err) {
      console.error(err.message);
    }
  }
};

/**
 * Sends a signin link to a user's email address
 * @param {string} email - A user's email address
 * @param {string} callbackUrl - where to direct user when they click URL
 * @returns {Promise} - Success or failure
 */
export const sendSignInLinkToEmail = async (email, callbackUrl) => {
  const actionCodeSettings = {
    url: callbackUrl ? callbackUrl : 'http://localhost:3000/finishSignUp',
    handleCodeInApp: true,
  };

  try {
    await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);

    return Promise.resolve();
  } catch (err) {
    console.log(err);

    return Promise.reject(err);
  }
};

/**
 * Provides the actual sign-in functionality for a user coming to the page via sign-in link
 * @param {string} email - Email address
 * @param {string} url - a url retrieved from a firebase email
 * @returns {Promise<('signed-in'),Error>}
 */
export const signInWithEmailLink = async (email, url: string) => {
  try {
    const signinLocation = url || window.location.href;
    const result = await firebase
      .auth()
      .signInWithEmailLink(email, signinLocation);
    window.localStorage.removeItem('emailForSignIn');
    window.localStorage.removeItem('linkForSignIn');
    analytics.track('Login Success', {
      category: 'Login',
      label: result.user && result.user.uid,
    });
    return Promise.resolve('signed-in');
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Runs a Firebase-backed check against the current URL to see if it's a valid sign-in link
 * https://firebase.google.com/docs/reference/js/firebase.auth.Auth#isSignInWithEmailLink
 * @returns {boolean} - true if the current URL a valid signin link
 */
export const confirmIsSignInWithEmailLink = () =>
  firebase.auth().isSignInWithEmailLink(window.location.href);

/**
 * Confirms a user's signin link is being used from the same device
 * @returns {Promise<('signed-in|not-signed-in|no-attempt-made')>} - 'no-attempt-made' denotes that a user landed on a page that serves dual use of both a sign-in page and a landing page
 */
export const confirmUserSignInLink = async () => {
  // Confirm the link is a sign-in with email link.
  if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    // Get the email if available. This should be available if the user completes the flow on the same device where they started it.
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      // User opened the link on a different device. To prevent session fixation attacks, ask the user to provide the associated email again.
      return Promise.resolve('not-signed-in');
    }

    // Continue sign-in procedure
    try {
      return signInWithEmailLink(email, null);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  return Promise.resolve('no-attempt-made');
};

/**
 * Signs in a user
 * @param {string} email - Email address for user
 * @param {string} password - Password for user
 * @returns {Promise} - Resolves or rejects with user creds (logged-in) or Firebase error
 */
export const signInWithEmailAndPassword = (
  email: string,
  password: string
): Promise<any | any> => {
  return new Promise((resolve, reject) => {
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(resolve)
      .catch(err => {
        reject(err);
      });
  });
};

/**
 * Gets signin methods for an email address
 * @param {string} email - Email address for user
 * @returns {Promise} - Resolves with possibly empty list of signin methods
 */
export const fetchSignInMethodsForEmail = (
  email: string
): Promise<string[] | any> => {
  return new Promise((resolve, reject) => {
    firebase
      .auth()
      .fetchSignInMethodsForEmail(email)
      .then(results => {
        resolve(results);
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
  });
};

/**
 * Determines if a user has an account or not
 * @param {string} emailAddress - Account to verify
 * @returns {boolean}
 */
const userHasAccount = async email_address => {
  try {
    const signinMethods = await firebase
      .auth()
      .fetchSignInMethodsForEmail(email_address);

    // Firebase returns an array of signin methods and it can be empty. If it is empty, user doesn't have an account
    return signinMethods.length > 0;
  } catch (err) {
    console.log(err);
    return err;
  }
};

/**
 * Creates a user with an a random password
 * @param {object} userFormData - An OSDI-formatted object. Requires email_address at a minimum
 * @returns {object} - A msg denoting user status and a user object
 */
export const postSignupCreateUserWithAccount = async (
  userFormData: any
): Promise<{
  msg: 'already_logged_in' | 'account_exists' | 'new_user_created';
  user?: firebase.auth.UserCredential | firebase.User;
}> => {
  const loggedInUser = currentUser();

  try {
    if (loggedInUser) {
      await createOrUpdateUserData(loggedInUser.uid, userFormData);
      return {
        msg: 'already_logged_in',
        user: loggedInUser,
      };
    }

    const hasAccount = await userHasAccount(userFormData.email_address);
    if (hasAccount) {
      return {
        msg: 'account_exists',
      };
    }

    /**
     * Generates a random password and creates a user account with it
     */
    const generatedPassword = randomize('Aa0!', 25);
    const {
      user,
    }: firebase.auth.UserCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(
        userFormData.email_address,
        generatedPassword
      );

    return {
      msg: 'new_user_created',
      user,
    };
  } catch (err) {
    console.log(err);
    if (err.code === 'auth/email-already-in-use') {
      return {
        msg: 'account_exists',
      };
    }

    return;
  }
};

/**
 * Sends an email when a user attempts link-based login but they don't have an account
 * @param {string} email - User's email address
 */
export const sendFailedLoginEmail = async (email: string) => {
  const sendgridSendFailedLoginEmail = firebase
    .functions()
    .httpsCallable('sendgridSendFailedLoginEmail');
  try {
    await sendgridSendFailedLoginEmail({ email });
    return;
  } catch (err) {
    return err;
  }
};

export default {
  authElevationListener,
  confirmUserSignInLink,
  createOrUpdateUserData,
  createUserWithEmailAndPassword,
  currentUser,
  getUserData,
  getUserRole,
  login,
  logout,
  postSignupCreateUserWithAccount,
  registerAnonUser,
  status,
  trackLogin,
  upgradeAnonymousUser,
  upgradeAnonymousUserWithEmail,
};
