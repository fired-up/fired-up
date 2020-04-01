import libphonenumber, {
  PhoneNumberFormat,
  PhoneNumberUtil,
} from 'google-libphonenumber';

import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

export default async function(signup: FiredUp.Signup) {
  const phoneUtil = PhoneNumberUtil.getInstance();

  const updatedSignup: any = {
    fields: signup.fields,
  };

  if (typeof signup.created_at === 'string') {
    updatedSignup.created_at = new Date(signup.created_at);
  }

  if (signup.fields.email_address) {
    // Lowercase email addresses
    updatedSignup.fields.email_address = signup.fields.email_address.toLowerCase();
  }

  for (const field in signup.fields) {
    // Trim surrounding whitespace
    if (signup.fields[field] && typeof signup.fields[field] === 'string') {
      updatedSignup.fields[field] = signup.fields[field].trim();
    }
  }

  // Standardize phone numbers
  if (signup.fields.phone_number) {
    try {
      const number = phoneUtil.parseAndKeepRawInput(
        signup.fields.phone_number,
        'US'
      );

      updatedSignup.fields.phone_number_number = phoneUtil.format(
        number,
        PhoneNumberFormat.E164
      );

      updatedSignup.fields.phone_number_extension = number.getExtension();
    } catch (error) {
      console.log('Cannot parse provided phone number');
    }
  }

  // Standarize Postal Codes
  if (signup.fields.postal_code) {
    if (signup.fields.postal_code.length > 5) {
      updatedSignup.fields.postal_code = signup.fields.postal_code.substr(0, 5);
    }

    if (isNaN(Number(signup.fields.postal_code))) {
      updatedSignup.fields.postal_code = null;
    }
  }

  return updatedSignup;
}
