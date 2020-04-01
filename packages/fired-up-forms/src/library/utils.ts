import _flattenDeep from 'lodash/flattenDeep';
import * as yup from 'yup';
import axios from 'axios';
import qs from 'qs';

const stateData = require('./stateData.json');

export const validationBuilder = (formSchema, values, lang = 'en') => {
  const validationSchema = {};

  const errorMessages = {
    required: {
      en: 'Required',
      es: 'Necesario',
    },
    phone_number: {
      en: 'Must be a valid US phone number',
      es: 'Número telefónico valido en EEUU',
    },
    postal_code: {
      en: 'Must be a valid US ZIP code',
      es: 'Código postal válido en EEUU',
    },
    email_address: {
      en: 'Valid e-mail required',
      es: 'Correo electrónico válido',
    },
    choose_one: {
      en: 'Choose at least one option',
      es: 'Elige por lo menos una opción',
    },
  };

  // Preset validaton types
  const types = {
    string: yup.string(),
    requiredString: yup.string().required(errorMessages.required[lang]),
    email_address: yup.string().email(errorMessages.email_address[lang]),
    checkbox: yup
      .boolean()
      .required(errorMessages.required[lang])
      .oneOf([true], errorMessages.required[lang]),
    phone_number: yup
      .string()
      .matches(
        /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/,
        errorMessages.phone_number[lang]
      ),
    postal_code: yup
      .string()
      .test('len', errorMessages.postal_code[lang], val => {
        if (!val) {
          return false;
        }

        const isNumeric = !isNaN(val);
        const isLongEnough = val.length === 5;

        return isNumeric && isLongEnough;
      }),
  };

  const flattenedSchema = _flattenDeep(formSchema);

  // Loop over form schema to determine how to validate each field
  for (const i in flattenedSchema) {
    const field: any = flattenedSchema[i];

    if (field.type && field.type === 'submit') {
      continue;
    } else if (field.type && field.type === 'tel') {
      validationSchema[field.name] = field.required
        ? types.phone_number.required(errorMessages.required[lang])
        : types.phone_number;
    } else if (field.name === 'postal_code') {
      // Postal Code is always required
      validationSchema[field.name] = types.postal_code.required(
        errorMessages.required[lang]
      );
    } else if (field.name === 'email_address') {
      // Email Address is always required
      validationSchema[field.name] = types.email_address.required(
        errorMessages.required[lang]
      );
    } else if (field.required && field.type === 'checkbox') {
      validationSchema[field.name] = types.checkbox;
    } else if (field.required && field.type === 'checkbox_group') {
      // Make an array of fieldnames that we must validate
      const valueKeys = field.values.map(x => x.value);

      // Dynamically generated rule to check that values contains at least one checked box
      validationSchema[field.name] = yup
        .string()
        .test('one_selected', errorMessages.choose_one[lang], val => {
          let valid = false;

          for (const key of valueKeys) {
            if (values[key]) {
              valid = true;
              break;
            }
          }

          return valid;
        });
    } else if (field.required) {
      validationSchema[field.name] = types.requiredString;
    }
  }

  return yup.object().shape(validationSchema);
};

export const buildInitialValues = formSchema => {
  const values = {};
  const params = qs.parse(location.search, { ignoreQueryPrefix: true });

  const flattenedSchema = _flattenDeep(formSchema);
  for (const i in flattenedSchema) {
    const field: any = flattenedSchema[i];
    if (field.type && field.type === 'submit') {
      continue;
    }

    values[field.name] = field.defaultValue || '';
  }

  if (params.vid) {
    values['referrer_id'] = params.vid;
  }

  return values;
};

// Save UTM params to localStorage so they persist
export const storeUTM = () => {
  if (typeof window === 'object' && typeof localStorage === 'object') {
    const params = qs.parse(location.search.substr(1));
    const source = {
      ...(params.fbclid && { fbclid: params.fbclid }),
      ...(params.gclid && { gclid: params.gclid }),
      ...(params.utm_source && { source: params.utm_source }),
      ...(params.utm_medium && { medium: params.utm_medium }),
      ...(params.utm_content && { content: params.utm_content }),
      ...((params.utm_name || params.utm_campaign) && {
        campaign: params.utm_name || params.utm_campaign,
      }),
      ...(params.utm_term && { term: params.utm_term }),
    };

    if (Object.keys(source).length > 0) {
      localStorage.setItem('utm', JSON.stringify(source));
    }
  }
};

/**
 * retrieves UTM params from localstorage and adds them to an object
 * @returns {object} field names with UTM params attached
 */
export const addUtmParams = () => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const utms = localStorage.getItem('utm')
    ? JSON.parse(localStorage.getItem('utm'))
    : {};

  return {
    gclid: utms.gclid || '',
    fbclid: utms.fbclid || '',
    source: utms.source || '',
    medium: utms.medium || '',
    content: utms.content || '',
    campaign: utms.name || utms.campaign || '',
    term: utms.term || '',
  };
};

interface FormattedAddress {
  latitude: number;
  longitude: number;
  postal_code: string;
  region: string;
}

/**
 * Gets more address details from a zip code
 * @param {string} postalCode - a 5 digit stringified zip
 * @returns {object} FormattedAddress - an address consist
 */
export const getGeoFromZip = async (
  postalCode: string
): Promise<FormattedAddress> => {
  try {
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?components=country:US|postal_code:${postalCode}&key=${process.env.GOOGLE_MAPS_KEY}`
    );

    const place = data.results[0];
    const components = {};

    if (!place) {
      console.log(`Error geocoding address for postal code: ${postalCode}`);

      return {
        latitude: null,
        longitude: null,
        postal_code: '',
        region: '',
      };
    }

    for (const component of place.address_components) {
      components[component.types[0]] = component['long_name'];
    }

    const stateName = components['administrative_area_level_1'];

    return {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      postal_code: postalCode,
      region: stateName ? stateData.longForm[stateName.toLowerCase()] : null,
    };
  } catch (err) {
    return err;
  }
};
