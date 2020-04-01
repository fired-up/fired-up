import { get as _get } from 'lodash';

import { expandAddress } from '../geo';
import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

export default async function(signup: FiredUp.Signup) {
  try {
    const expandAddressResponse = await expandAddress(signup.fields);

    // If we got a full address string, expand all the address fields
    if (signup.fields.address) {
      return {
        fields: {
          ...signup.fields,
          address_line1: _get(expandAddressResponse, 'address_line1', null),
          locality: _get(expandAddressResponse, 'locality', null),
          region: _get(expandAddressResponse, 'region', null),
          postal_code: _get(expandAddressResponse, 'postal_code', null),
          latitude: _get(expandAddressResponse, 'latitude', null),
          longitude: _get(expandAddressResponse, 'longitude', null),
        },
      };
    }

    return {
      fields: {
        ...signup.fields,
        region: _get(expandAddressResponse, 'region', null),
        latitude: _get(expandAddressResponse, 'latitude', null),
        longitude: _get(expandAddressResponse, 'longitude', null),
      },
    };
  } catch (error) {
    console.error(error);

    return {};
  }
}
