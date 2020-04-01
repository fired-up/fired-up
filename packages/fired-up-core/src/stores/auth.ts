import auth from '../library/auth';
import firebase from '../library/firebase';
import { FiredUp } from '../../../fired-up-typings/functions/typings/firedup';

export interface AuthStateInterface {
  error: boolean;
  errorCode: string;
  hasCheckedAuth: boolean;
  hasJustVerifiedAccount: boolean;
  isLoggedIn: boolean;
  provider: string;
  role: string;
  user: firebase.auth.UserCredential;
  userProfile: FiredUp.User;
}

export const INITIAL_STATE: AuthStateInterface = {
  error: false,
  errorCode: null,
  hasCheckedAuth: false,
  hasJustVerifiedAccount: false,
  isLoggedIn: null,
  provider: '',
  role: null,
  user: null,
  userProfile: null,
};

///////////////
// Constants //
///////////////
export const ACTION_TYPES = {
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGIN_ERROR: 'AUTH_LOGIN_ERROR',
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_REFRESH: 'AUTH_REFRESH',
  AUTH_RESET_ERROR_CODE: 'AUTH_RESET_ERROR_CODE',
  AUTH_UPGRADE_ACCOUNT_FAILURE: 'AUTH_UPGRADE_ACCOUNT_FAILURE',
  AUTH_UPGRADE_ACCOUNT_SUCCESS: 'AUTH_UPGRADE_ACCOUNT_SUCCESS',
  AUTH_UPDATE_USER_PROFILE: 'AUTH_UPDATE_USER_PROFILE',
  AUTH_FETCH_USER_PROFILE_SUCCESS: 'AUTH_FETCH_USER_PROFILE_SUCCESS',
};

//////////////
// Actions //
/////////////
export default {
  status() {
    return dispatch => {
      auth.status(async user => {
        if (user) {
          try {
            const postLogin = firebase
              .functions()
              .httpsCallable('adminPostLogin');
            const userAuthInfo = await auth.getUserRole();
            const userProfile = await auth.getUserData();

            // Run asynchronously with dispatch();
            postLogin();

            dispatch({
              provider: userAuthInfo.provider,
              role: userAuthInfo.role,
              type: ACTION_TYPES.AUTH_LOGIN,
              user,
              userProfile,
            });
          } catch (error) {
            console.error(error);
          }
        } else {
          dispatch({
            type: ACTION_TYPES.AUTH_LOGOUT,
          });
        }
      });
    };
  },

  login() {
    return dispatch => {
      return new Promise((resolve, reject) => {
        auth
          .login()
          .then(user => {
            this.authElevationListener(user);
            dispatch({
              type: ACTION_TYPES.AUTH_LOGIN_SUCCESS,
            });

            resolve(user);
          })
          .catch(error => {
            dispatch({
              error,
              type: ACTION_TYPES.AUTH_LOGIN_ERROR,
            });

            reject();
          });
      });
    };
  },

  logout() {
    return () => {
      return auth.logout();
    };
  },

  upgradeAnonymousUserWithEmail(email, password) {
    return dispatch => {
      return new Promise(resolve => {
        auth
          .upgradeAnonymousUserWithEmail(email, password)
          .then(user => {
            dispatch({
              user,
              type: ACTION_TYPES.AUTH_UPGRADE_ACCOUNT_SUCCESS,
            });
            resolve(user);
          })
          .catch(errorCode => {
            dispatch({
              type: ACTION_TYPES.AUTH_UPGRADE_ACCOUNT_FAILURE,
              errorCode,
            });
          });
      });
    };
  },

  resetErrorCode() {
    return dispatch => {
      dispatch({
        type: ACTION_TYPES.AUTH_RESET_ERROR_CODE,
      });
    };
  },

  authElevationListener(user) {
    return dispatch => {
      auth.authElevationListener(user, () => {
        auth.getUserRole().then(userDetails => {
          dispatch({
            user,
            provider: userDetails.provider,
            role: userDetails.role,
            type: ACTION_TYPES.AUTH_REFRESH,
          });
        });
      });
    };
  },

  updateUserProfile(updateData) {
    return dispatch => {
      dispatch({
        updateData,
        type: ACTION_TYPES.AUTH_UPDATE_USER_PROFILE,
      });
    };
  },

  refetchUser() {
    return async dispatch => {
      const userProfile = await auth.getUserData();
      dispatch({
        userProfile,
        type: ACTION_TYPES.AUTH_FETCH_USER_PROFILE_SUCCESS,
      });
    };
  },
};

//////////////
// Reducers //
//////////////
export function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.AUTH_LOGIN:
    case ACTION_TYPES.AUTH_REFRESH:
      return {
        ...state,
        hasCheckedAuth: true,
        isLoggedIn: true,
        provider: action.provider,
        role: action.role,
        user: action.user,
        userProfile: action.userProfile,
      };

    case ACTION_TYPES.AUTH_UPGRADE_ACCOUNT_SUCCESS:
      return {
        ...state,
        hasJustVerifiedAccount: true,
        user: action.user ? action.user : state.user,
      };

    case ACTION_TYPES.AUTH_UPGRADE_ACCOUNT_FAILURE:
      return {
        ...state,
        errorCode: action.errorCode,
      };

    case ACTION_TYPES.AUTH_RESET_ERROR_CODE:
      return {
        ...state,
        errorCode: null,
      };

    case ACTION_TYPES.AUTH_LOGOUT:
      return {
        ...state,
        hasCheckedAuth: true,
        isLoggedIn: false,
        user: {},
        userProfile: {},
      };

    case ACTION_TYPES.AUTH_LOGIN_SUCCESS:
      return {
        ...state,
        error: false,
      };

    case ACTION_TYPES.AUTH_LOGIN_ERROR:
      return {
        ...state,
        error: action.error,
      };

    case ACTION_TYPES.AUTH_UPDATE_USER_PROFILE:
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          ...action.updateData,
        },
      };

    case ACTION_TYPES.AUTH_FETCH_USER_PROFILE_SUCCESS:
      return {
        ...state,
        userProfile: action.userProfile,
      };

    default:
      return state;
  }
}
