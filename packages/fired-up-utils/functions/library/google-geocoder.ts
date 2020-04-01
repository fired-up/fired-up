import * as http from 'http';
import * as https from 'https';

import axios from 'axios';
import * as qs from 'querystring';
import * as functions from 'firebase-functions';

import { logAPIrequest } from '../../../fired-up-core/functions/library/api-logger';

const instance = axios.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

export async function googleGeocoder(address) {
  try {
    const params = qs.stringify({
      key: functions.config().google.maps_key,
      address: `${address}, USA`,
    });

    // Prepare the geolookup call
    const URL = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;

    const geocoderResponse = await instance.get(URL);

    logAPIrequest(
      'Google Maps Geocoder',
      'expandAddress()',
      'GET',
      'https://maps.googleapis.com/maps/api/geocode/json',
      geocoderResponse.status
    );

    if (geocoderResponse) {
      const data = geocoderResponse.data;

      const address = {
        region: null,
        latitude: null,
        locality: null,
        longitude: null,
        postal_code: null,
        address_line1: null,
      };

      const addressTemp = {
        route: null,
        locality: null,
        postal_code: null,
        street_number: null,
        administrative_area_level_1: null,
      };

      if (data.results.length > 0) {
        const geometry = data.results[0].geometry;
        const components = data.results[0].address_components;

        for (var i = 0; i < components.length; i++) {
          var addressType = components[i].types[0];

          // Grab abbreviated state name
          if (addressType === 'administrative_area_level_1') {
            addressTemp[addressType] = components[i].short_name;
          } else {
            addressTemp[addressType] = components[i].long_name;
          }
        }

        address.address_line1 = `${addressTemp.street_number} ${addressTemp.route}`;
        address.locality = addressTemp.locality;
        address.latitude = geometry.location.lat;
        address.longitude = geometry.location.lng;
        address.postal_code = addressTemp.postal_code;
        address.region = addressTemp.administrative_area_level_1;

        return address;
      }
    }
  } catch (error) {
    console.error(error);
  }

  return {};
}
