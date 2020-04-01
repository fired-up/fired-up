import React from 'react';
import firebase from './firebase';
import { getUserData } from './auth';

const LSKey = 'ajs_user_traits';
const SSR = { ssr: true };
const userPropertiesWhitelist = [
  'email_address',
  'family_name',
  'given_name',
  'vid',
  'donor',
  'address_line1',
  'postal_code',
  'phone_number',
  'locality',
  'region',
  'avatarPath',
  'completed_ctv',
];

/**
 * User Context using React Context API
 */
export const userContext = React.createContext(SSR);

/**
 * User storage engine
 *
 * The user storage will try to use Analytics.js as a default. If that's not available,
 * then it will directly access localStorage.
 *
 * The primary key for localStorage is defined by Analytics.js: ajs_user_traits
 */
export const getUser = () => {
  // only check localStorage if window defined (DOM)
  if (typeof window === 'undefined') return SSR;
  if (typeof localStorage === 'undefined') return SSR;

  let ITEM = {};

  // try analytics.js
  if (typeof analytics === 'function' && analytics.hasOwnProperty('user')) {
    return analytics.user().traits();
    // otherwise use localStorage
  } else {
    const it = localStorage.getItem(LSKey);
    ITEM = it;
    try {
      ITEM = JSON.parse(it);
    } catch (e) {
      return ITEM;
    }
  }

  return ITEM;
};

export const updateUser = item => {
  // only check localStorage if window defined (DOM)
  if (typeof window === 'undefined') return {};
  if (typeof localStorage === 'undefined') return {};

  let returnValue;
  let detail = item;

  // object?
  if (typeof item !== 'string') {
    let traits = getUser();
    const v = { ...traits, ...item };
    detail = v; // use for event

    // try analytics.js
    if (typeof analytics === 'function' && analytics.hasOwnProperty('user')) {
      // set traits, track upstream
      analytics.identify(analytics.user().id(), getUser());
    } else {
      returnValue = localStorage.setItem(LSKey, JSON.stringify(v));
    }
  } else {
    // simple string
    returnValue = localStorage.setItem(LSKey, item);
  }

  // notify any listeners
  const e = new CustomEvent('firedup-user-updated', {
    bubbles: true,
    detail,
  });
  document.dispatchEvent(e);

  return returnValue;
};

/**
 * Watcher for login status using Firebase
 *
 * @param props root context element props
 * @param callback custom callback on init
 * @return Object: user data
 */
export const userInit = (callback = null) => {
  // check login state
  const init = callback => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        return callback(user);
      } else {
        // User is logged out
        return callback(false);
      }
    });
  };
  if (typeof callback === 'function') {
    init(callback);
  } else {
    // Add additional user traits here based on login status
    init(async user => {
      if (user) {
        let updates = { isLoggedIn: true };
        if (user.emailVerified) updates['email_address'] = user.email;
        if (user.phoneNumber) updates['phone_number'] = user.phoneNumber;
        // save values
        updateUser(updates);
        // now grab latest data from DB
        const userProfile = await getUserData();
        // update user data from DB
        Object.keys(userProfile).forEach(k => {
          if (userPropertiesWhitelist.indexOf(k) >= 0) {
            updates[k] = userProfile[k];
          }
        });

        // update with loaded user data fro DB
        updateUser(updates);
      } else {
        updateUser({ isLoggedIn: false });
      }
    });
  }

  // immediately return user state
  return getUser();
};

/**
 * Reducer for User object
 *
 * UPDATE dispatched:
 * This reducer will pull the existing traits from localStorage/analytics.js
 * then store the merged updates to back in localStorage/analytics.js
 *
 * @param state object: previous state
 * @param action object: { "type": string, "traits": object } updates
 */
export function userReducer(state = getUser(), action) {
  const [user, setUser] = React.useContext(userContext);

  if (action.type === 'UPDATE') {
    // set to localStorage/analytics.js
    updateUser(action.traits);
  }

  // move up the context
  const tmp = getUser();
  setUser(tmp);

  return tmp;
}

export const UserProvider = props => {
  const [user, setUser] = React.useState(userInit());

  return React.createElement(
    userContext.Provider,
    { value: [user, setUser] },
    props.children
  );
};

export default userContext;
