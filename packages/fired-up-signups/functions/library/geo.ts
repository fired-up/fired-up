import { find as _find } from 'lodash';
import { googleGeocoder } from '../../../fired-up-utils/functions/library/google-geocoder';

const zipsToLatLng = require('../data/zips-to-lat-lng.json');
const zipsToStateCD = require('../data/zips-to-state-cd.json').zips;
const fullStateToAbbrs = require('../data/full-state-to-abbr.json').states;

/**
 * expandAddress helps us add region, latitude, and longitude to signups
 * @param {object} signupFields - An OSDI formatted signup object. Should include an `address`.
 * @returns {object} - An updated address object that includes the previously missing information.
 */
export const expandAddress = async signupFields => {
  let address = signupFields.postal_code;

  // Geocode when postal code is present and lat, lon, or region isn't.
  if (
    (signupFields.address || signupFields.postal_code) &&
    (!signupFields.latitude || !signupFields.longitude || !signupFields.region)
  ) {
    let updated: {
      region?: string;
      latitude?: number;
      longitude?: number;
    } = {
      region: signupFields.region,
      latitude: signupFields.latitude,
      longitude: signupFields.longitude,
    };

    if (signupFields.address) {
      // If a full, ungeocoded address is passed in in a single field, set that
      address = signupFields.address;
    } else if (signupFields.address_line1) {
      // If an address split into multiple fields is not already geocoded, run geocoder
      address = `${signupFields.address_line1}, ${signupFields.locality}, ${signupFields.region}, ${signupFields.postal_code}`;
    } else {
      // Attempt to match zip to a predefined CSV to lat/lon mapping to save a geolookup call

      if (signupFields.region && signupFields.region.length !== 2) {
        // Replace region with 2 char
        let abbr = '';

        // Set region to the states abbreviation if it's the long name
        for (const state of fullStateToAbbrs) {
          if (state.alt) {
            for (const alt of state.alt) {
              if (alt.toLowerCase() === signupFields.region.toLowerCase()) {
                abbr = state.short;
              }
            }
          }

          if (state.name.toLowerCase() === signupFields.region.toLowerCase()) {
            abbr = state.short;
          }
        }

        if (abbr) {
          updated.region = abbr;
        }
      }

      // Try to lookup the zip code
      if (signupFields.postal_code) {
        const fiveCharPostalCode = signupFields.postal_code.substr(0, 5);

        if (zipsToLatLng[fiveCharPostalCode]) {
          updated.latitude = zipsToLatLng[fiveCharPostalCode].LAT;
          updated.longitude = zipsToLatLng[fiveCharPostalCode].LNG;
        }

        // Zip code starts with 0, parse as string
        // Zip code starts with other, parse as number
        const stateCDMatch = _find(zipsToStateCD, {
          zcta:
            Number(fiveCharPostalCode) / 10000 < 1
              ? fiveCharPostalCode
              : Number(fiveCharPostalCode),
        });

        if (stateCDMatch) {
          updated.region = stateCDMatch.state_abbr;
        }
      }

      // Only use the data from CSV if it actually sets values - otherwise, fallback to Google Maps Geocoder
      if (updated.latitude && updated.longitude && updated.region) {
        return updated;
      }
    }

    return await googleGeocoder(address);
  }

  return;
};

export default {
  expandAddress,
};
