import firebase from 'firebase/app';
import 'firebase/firestore';

import fromUnixTime from 'date-fns/fromUnixTime';

/**
 * Given a phone number, formats it
 * https://stackoverflow.com/a/8358141/628699
 */
export const formatPhoneNumber = (phoneNumberString: string) => {
  if (!phoneNumberString) {
    return;
  }

  var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    var intlCode = match[1] ? '+1 ' : '';
    return ['(', match[2], ') ', match[3], '-', match[4]].join('');
  }
  return null;
};

/**
 * Used when we know we have some sort of date but it's unclear what type
 * it's actually going to be. Can wrap with this and guarantee a JS Date output
 * @returns {Date}
 */
export const __UNSAFE__timestampToDate = (
  uncertainTimestamp: string | firebase.firestore.Timestamp | Date
): Date => {
  // Is a string representation of a date
  if (typeof uncertainTimestamp === 'string') {
    return new Date(uncertainTimestamp);
  }

  if (typeof uncertainTimestamp === 'number') {
    return fromUnixTime(uncertainTimestamp);
  }

  // Is a Date
  if ('getDate' in uncertainTimestamp) {
    return uncertainTimestamp;
  }

  // is firestore Timestamp value
  if ('toDate' in uncertainTimestamp) {
    return uncertainTimestamp.toDate();
  }
};
