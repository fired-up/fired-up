import { flatten as _flatten, forEach as _forEach } from 'lodash';
import axios from 'axios';
import firebase from 'fired-up-core/src/library/firebase';

import { addUtmParams } from './utils';

export const getSignupContext = async () => {
  if (!window['FIRED_UP_CONTEXT_INITIATED']) {
    try {
      window['FIRED_UP_CONTEXT_INITIATED'] = true;

      const { data } = await axios.get(
        `${process.env.FIREBASE_FUNCTIONS_URL}/firedupContext`
      );

      const coords = data.citylatlong.split(',');

      window['FIRED_UP_CONTEXT'] = {
        ip_address_latitude: coords[0],
        ip_address_longitude: coords[1],
        ip_address: data['user-ip'],
        user_agent: JSON.stringify(data['user-agent']),
        region: data['region'],
        city: data['city'],
      };
    } catch (error) {}
  }

  return;
};

/**
 * Processor for various field types
 * - removes checkbox group field prior to submission
 */
export const processFields = (fields, formFields) => {
  const fieldList = _flatten(formFields);
  fieldList.forEach((field: any) => {
    if (field.type === 'checkbox_group') {
      delete fields[field.name];
    }
  });

  return fields;
};

export const submit = async (fields, formType, formID, customTasks?) => {
  let context = window['FIRED_UP_CONTEXT'] || {};

  if (fields.phone_number_sms_capable) {
    fields.phone_number_sms_capable = true;
  } else {
    delete fields.phone_number_sms_capable;
  }

  /**
   * Remove empty checkboxes prior to submission
   * @todo: should all blank/null values be removed?
   */
  _forEach(fields, (value, key) => {
    // Checkboxes save a string value of "true" to Firestore/BigQuery. Or 'null' if unchecked
    // Within Formik, we handle them as true/false so convert values here.
    if (value === true) {
      fields[key] = 'true';
    } else if (value === false) {
      delete fields[key];
    }
  });

  const signup = {
    fields: fields,
    form_id: formID,
    type: formType || 'signup',
    url: window.location.href,
    utm: addUtmParams(),
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
    ...context,
  };

  if (customTasks) {
    signup.fired_up_custom_tasks = customTasks;
  }

  try {
    await firebase
      .firestore()
      .collection('signups')
      .add(signup);
  } catch (error) {
    // TODO: Custom error integrations belong here
    throw new Error(error);
  }

  return;
};

export default {
  submit,
  getSignupContext,
};
