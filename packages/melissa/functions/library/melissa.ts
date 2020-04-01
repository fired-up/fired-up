import axios from 'axios';
import { get as _get } from 'lodash';
import * as functions from 'firebase-functions';
import { writeToTable } from '../../../fired-up-bigquery/functions/library/bigquery';

const MELISSA_API_KEY = functions.config().melissa.key;

export async function melissaBigqueryLog(
  email_address: string,
  melissa_response: any
) {
  try {
    await writeToTable('melissa', 'personator_logs', {
      insertId: `${new Date().getTime()}-${Math.floor(
        Math.random() * Math.floor(100000)
      )}`,
      json: {
        ...melissa_response,
        email_address,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error(`Error writing to table`);
  }

  return;
}

export function melissaProcessResponse(melissa_response: any) {
  // Melissa sends back strings with single spaces in them which are truthy
  for (const key of Object.keys(melissa_response)) {
    const trimmed = melissa_response[key].trim();

    if (trimmed) {
      melissa_response[key] = trimmed;
    } else {
      melissa_response[key] = null;
    }
  }

  // Split zip code from XXXXX-XXXX to split first 5 and last 4
  const postal_code_pieces = (melissa_response.PostalCode || '').split('-');
  const postal_code = postal_code_pieces[0];
  const postal_code4 = postal_code_pieces[1];

  // Rebuild address line 1 if suite number is present
  let address_line1 = melissa_response.AddressLine1;

  if (melissa_response.AddressSuiteNumber) {
    address_line1 = melissa_response.AddressHouseNumber;

    if (melissa_response.AddressPreDirection) {
      address_line1 = `${address_line1} ${melissa_response.AddressPreDirection}`;
    }

    if (melissa_response.AddressStreetPrefix) {
      address_line1 = `${address_line1} ${melissa_response.AddressStreetPrefix}`;
    }

    if (melissa_response.AddressStreetName) {
      address_line1 = `${address_line1} ${melissa_response.AddressStreetName}`;
    }

    if (melissa_response.AddressStreetSuffix) {
      address_line1 = `${address_line1} ${melissa_response.AddressStreetSuffix}`;
    }

    if (melissa_response.AddressPostDirection) {
      address_line1 = `${address_line1} ${melissa_response.AddressPostDirection}`;
    }
  }

  const data = {
    cleaned_provider: 'melissa',
    cleaned_mode: postal_code ? 'full address' : 'address without zip',
    cleaned_provider_key: melissa_response.AddressKey || null,
    cleaned_melissa_results: melissa_response.Results || null,
    cleaned_address_line1: address_line1 || null,
    cleaned_locality: melissa_response.City || null,
    cleaned_region: melissa_response.State || null,
    cleaned_postal_code: postal_code || null,
    cleaned_postal_code4: postal_code4 || null,
  };

  return data;
}

export async function melissaAPIRequest(
  address_line1: string,
  locality: string, // TODO: why isn't the lookup using this?
  region: string,
  postal_code?: string
) {
  try {
    const URL =
      'https://personator.melissadata.net/v3/WEB/ContactVerify/doContactVerify';

    const params = {
      // Same for every request
      ctry: 'US',
      act: 'Check',
      format: 'JSON',
      cols: 'GrpParsedAddress',
      id: MELISSA_API_KEY,

      // Address variables
      a1: address_line1,
      state: region,
    };

    if (postal_code) {
      params.postal = postal_code;
    }

    const response = await axios({
      url: URL,
      method: 'GET',
      params,
    });

    const record = _get(response, 'data.Records[0]', null);

    if (!record) {
      console.log(
        'Melissa: no results for ',
        address_line1,
        locality,
        region,
        postal_code
      );

      return {};
    }

    return record;
  } catch (error) {
    console.error(error);

    return {};
  }
}

export async function melissaAddressCleanup(
  email_address: string,
  address_line1: string,
  locality: string,
  region: string,
  postal_code?: string
) {
  try {
    const melissaResponse = await melissaAPIRequest(
      address_line1,
      locality,
      region,
      postal_code
    );

    await melissaBigqueryLog(email_address, melissaResponse);

    const cleanedAddress = melissaProcessResponse(melissaResponse);

    return cleanedAddress;
  } catch (error) {
    console.error(error);
  }

  return {};
}

export default {
  melissaAPIRequest,
  melissaBigqueryLog,
  melissaAddressCleanup,
  melissaProcessResponse,
};
