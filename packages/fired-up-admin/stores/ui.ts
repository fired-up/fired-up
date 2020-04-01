/**
 * Keep track of modal types in one place so we don't have to hunt through app
 */
export const MODAL_TYPES = {
  EDIT_RECRUITMENT_PAGE: 'EDIT_RECRUITMENT_PAGE',
  EDIT_USER: 'EDIT_USER',
};

const INITIAL_STATE = {
  openModal: '',
};

const ACTION_TYPES = {
  MODAL_CLOSE: 'MODAL_CLOSE',
  MODAL_OPEN: 'MODAL_OPEN',
};

/**
 * Actions
 */

/**
 * Opens a modal with given 'id'
 * @param {string} id - Name of modal to open
 */
export const openModal = (id: string) => dispatch =>
  dispatch({
    id,
    type: ACTION_TYPES.MODAL_OPEN,
  });

/**
 * Closes the currently open modal
 */
export const closeModal = () => dispatch =>
  dispatch({
    type: ACTION_TYPES.MODAL_CLOSE,
  });

/**
 * Reducers
 */
export const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ACTION_TYPES.MODAL_OPEN:
      return {
        ...state,
        openModal: action.id,
      };

    case ACTION_TYPES.MODAL_CLOSE:
      return {
        ...state,
        openModal: '',
      };

    default:
      return state;
  }
};
