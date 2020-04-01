import autoresponders from '../library/autoresponders';

const deleteProperty = ({ [key]: _, ...newObj }, key) => newObj;

export const INITIAL_STATE = {
  autoresponders: {},
  error: null,
};

export const ACTION_TYPES = {
  AUTORESPONDERS_DELETE: 'AUTORESPONDERS_DELETE',
  AUTORESPONDERS_ERROR: 'AUTORESPONDERS_ERROR',
  AUTORESPONDERS_GET: 'AUTORESPONDERS_GET',
  AUTORESPONDERS_WRITE: 'AUTORESPONDERS_WRITE',
};

/**
 * Actions
 */
const getAutoresponders = () => async dispatch => {
  try {
    const result = await autoresponders.getAutoresponders();
    dispatch({
      autoresponders: result,
      type: ACTION_TYPES.AUTORESPONDERS_GET,
    });
  } catch (err) {
    dispatch({
      error: err,
      type: ACTION_TYPES.AUTORESPONDERS_ERROR,
    });
  }
};

const writeAutoresponder = (fields, id) => async dispatch => {
  try {
    const result: {
      id: string;
    } = await autoresponders.writeAutoresponder(id, fields);
    dispatch({
      id: result.id,
      autoresponder: fields,
      type: ACTION_TYPES.AUTORESPONDERS_WRITE,
    });
  } catch (err) {
    console.log(err);
  }
};

const deleteAutoresponder = (id: string) => async dispatch => {
  try {
    const result = await autoresponders.deleteAutoresponder(id);
    dispatch({
      id: result.id,
      type: ACTION_TYPES.AUTORESPONDERS_DELETE,
    });
  } catch (err) {
    console.log(err);
  }
};

export default {
  deleteAutoresponder,
  getAutoresponders,
  writeAutoresponder,
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

    case ACTION_TYPES.AUTORESPONDERS_DELETE:
      return Object.assign({}, state, {
        error: null,
        autoresponders: deleteProperty(state.autoresponders, action.id),
      });

    default:
      return state;
  }
}
