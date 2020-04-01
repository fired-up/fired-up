import thunk from 'redux-thunk';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import { reducer as adminFormsReducer } from '../components/Forms/stores';
import { reducer as authReducer } from '../../fired-up-core/src/stores/auth';
import { reducer as uiReducer } from './ui';

export function initializeStore(initialState = {}) {
  const reducer = combineReducers({
    adminForms: adminFormsReducer,
    auth: authReducer,
    ui: uiReducer,
  });

  const middleware = [thunk];
  const loadedPlugins = composeWithDevTools(applyMiddleware(...middleware));

  return createStore(reducer, initialState, loadedPlugins);
}
