import { firestore } from 'fired-up-core/src/library/firebase';

/**
 * Query the people database with one of several common fields
 * @param {string} selectedQuery One of name | email | user_id | people_id | van_id
 * @param {object} queryConditions query field. { given_name | family_name | email | user_id | people_id | van_id }
 */
export async function peopleQuery(
  selectedQuery: 'name' | 'email' | 'user_id' | 'people_id' | 'van_id',
  queryConditions
) {
  let conditional;
  const ref = firestore.collection('people');

  if (selectedQuery === 'name') {
    const given_name = queryConditions.given_name
      ? queryConditions.given_name.toLowerCase().trim()
      : ' ';
    const family_name = queryConditions.family_name
      ? queryConditions.family_name.toLowerCase().trim()
      : ' ';

    conditional = ref
      .where(`index_given_name.${given_name}`, '==', true)
      .where(`index_family_name.${family_name}`, '==', true);
  } else if (selectedQuery === 'email') {
    const email_address = queryConditions.email
      ? queryConditions.email.toLowerCase().trim()
      : '';

    conditional = ref.where('email_address', '==', email_address);
  } else if (selectedQuery === 'user_id') {
    const user_id = queryConditions.user_id || '';

    conditional = ref.where('firebase_user_id', '==', user_id);
  } else if (selectedQuery === 'person_id') {
    const person_id = queryConditions.person_id || '';

    conditional = ref.doc(person_id);
  } else if (selectedQuery === 'van_id') {
    const van_id = queryConditions.van_id || '';

    conditional = ref.where('myc_van_id', '==', van_id);
  }

  const results = await conditional.get();

  if (results.docs) {
    const set = [];

    for (const doc of results.docs) {
      set.push({ id: doc.id, ...doc.data() });
    }

    return set;
  } else {
    return [{ id: results.id, ...results.data() }];
  }
}

export default {
  peopleQuery,
};
