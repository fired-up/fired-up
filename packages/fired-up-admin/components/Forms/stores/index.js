import forms from '../library/forms';

export const INITIAL_STATE = {
  error: null,
  forms: {},
  writeComplete: null,
};

///////////////
// Constants //
///////////////
export const ACTION_TYPES = {
  FORMS_ERROR: 'FORMS_ERROR',
  FORMS_GET: 'FORMS_GET',
  FORMS_WRITE_COMPLETE: 'FORMS_WRITE_COMPLETE',
  FORMS_WRITE_RESET: 'FORMS_WRITE_RESET',
  FORMS_WRITE: 'FORMS_WRITE',
};

const getForms = () => async dispatch => {
  try {
    const res = await forms.getForms();
    dispatch({
      forms: res,
      type: ACTION_TYPES.FORMS_GET,
    });
  } catch (err) {
    dispatch({
      error: err,
      type: ACTION_TYPES.FORMS_ERROR,
    });
  }
};

const writeForm = (id, fields) => async dispatch => {
  try {
    const res = await forms.writeForm(id, fields);
    dispatch({
      id: res.id,
      form: fields,
      type: ACTION_TYPES.FORMS_WRITE_COMPLETE,
    });
  } catch (err) {
    console.log(err);
  }
};

const resetFormWriteStatus = () => dispatch =>
  dispatch({
    type: ACTION_TYPES.FORMS_WRITE_RESET,
  });

export default {
  getForms,
  resetFormWriteStatus,
  writeForm,
};

export function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ACTION_TYPES.FORMS_GET:
      return Object.assign({}, state, {
        error: null,
        forms: action.forms,
      });

    case ACTION_TYPES.FORMS_WRITE:
      return Object.assign({}, state, {
        writeComplete: false,
        error: null,
        forms: Object.assign({}, state.forms, {
          [action.id]: action.form,
        }),
      });

    case ACTION_TYPES.FORMS_WRITE_COMPLETE:
      return Object.assign({}, state, {
        writeComplete: true,
        forms: Object.assign({}, state.forms, {
          [action.id]: action.form,
        }),
      });

    case ACTION_TYPES.FORMS_WRITE_RESET:
      return Object.assign({}, state, {
        writeComplete: false,
      });

    case ACTION_TYPES.FORMS_ERROR:
      return Object.assign({}, state, {
        error: action.error,
      });

    default:
      return state;
  }
}
