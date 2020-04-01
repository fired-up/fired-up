import autoresponders from '../library/autoresponders';

export const INITIAL_STATE = {
  autoresponders: {},
  error: null,
};

///////////////
// Constants //
///////////////
export const ACTION_TYPES = {
  AUTORESPONDERS_GET: 'AUTORESPONDERS_GET',
  AUTORESPONDERS_WRITE: 'AUTORESPONDERS_WRITE',
  AUTORESPONDERS_ERROR: 'AUTORESPONDERS_ERROR',
};

//////////////
// Actions //
/////////////
export default {
  getAutoresponders() {
    return dispatch => {
      autoresponders
        .getAutoresponders()
        .then(autoresponders => {
          dispatch({
            autoresponders,
            type: ACTION_TYPES.AUTORESPONDERS_GET,
          });
        })
        .catch(error => {
          dispatch({
            error,
            type: ACTION_TYPES.AUTORESPONDERS_ERROR,
          });
        });
    };
  },

  writeAutoresponder(fields, id) {
    return dispatch => {
      return new Promise(resolve => {
        autoresponders.writeAutoresponder(id, fields).then(result => {
          dispatch({
            id: result.id,
            autoresponder: fields,
            type: ACTION_TYPES.AUTORESPONDERS_WRITE,
          });
          resolve();
        });
      });
    };
  },
};

//////////////
// Reducers //
//////////////
export function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.AUTORESPONDERS_GET:
      return Object.assign({}, state, {
        error: null,
        autoresponders: action.autoresponders,
      });

    case ACTION_TYPES.AUTORESPONDERS_WRITE:
      return Object.assign({}, state, {
        error: null,
        autoresponders: Object.assign({}, state.autoresponders, {
          [action.id]: action.autoresponder,
        }),
      });

    case ACTION_TYPES.AUTORESPONDERS_ERROR:
      return Object.assign({}, state, {
        error: action.error,
      });

    default:
      return state;
  }
}
