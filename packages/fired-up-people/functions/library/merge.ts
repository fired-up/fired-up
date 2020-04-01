import * as _ from 'lodash';
import firebase from 'firebase-admin';
import { calculatePrimaryFields } from './people';

const firestore = firebase.firestore();

/**
 * Find instances of duplicated people by given field.
 * Field is just "email_address" for now but would be phone_number if we were using that as unique key
 * @param person_id {string} Firebase Person ID
 * @param field {string} fieldname
 */
export async function findMatchesBy(person_id: string, field: string) {
  try {
    const matches = [];
    const doc = await firestore
      .collection('people')
      .doc(person_id)
      .get();
    const data = doc.data();
    const value = data[field];
    const results = await firestore
      .collection('people')
      .where(field, '==', value)
      .get();

    for (const doc of results.docs) {
      if (doc.id !== person_id) {
        matches.push(doc.id);
      }
    }

    return matches;
  } catch (error) {
    throw error;
  }
}

/**
 * Parse the Meta object in a person (which contains the history of changes) to calculate
 * aggregates about the person object (number of fields, total number of changes in meta, form IDs)
 * @param person_meta {FiredUp.Person.Meta} Meta object from a Fired Up Person
 */
function parsePreviousSubmissions(person_meta) {
  let submissions_count = 0;
  const submission_ids = [];
  const fields = Object.keys(person_meta);

  for (const field of fields) {
    if (person_meta[field] && person_meta[field].history) {
      for (const key of Object.keys(person_meta[field].history)) {
        const submission = person_meta[field].history[key];

        submissions_count++;

        if (submission_ids.indexOf(submission.source) === -1) {
          submission_ids.push(submission.source);
        }
      }
    }
  }

  return {
    fields_count: fields.length,
    submission_ids,
    submissions_count,
  };
}

function joinPersonMeta(master_person_meta, replica_person_meta) {
  const meta_changes = _.cloneDeep(master_person_meta);
  const replica_fields = Object.keys(replica_person_meta);

  // Make sure Firestore timestamps get saved back to database as timestamps
  function processValue(value) {
    // Process dates
    if (
      value &&
      typeof value === 'object' &&
      typeof value.toDate === 'function'
    ) {
      console.log('processValue: Converting Firestore Date to JS date');
      return value.toDate();
    } else if (
      value &&
      typeof value === 'object' &&
      value.seconds &&
      value.nanoseconds
    ) {
      console.log('processValue: Fixing mis-written timestamp');
      return firebase.firestore.Timestamp.fromMillis(value.seconds * 1000);
    } else if (value && typeof value === 'object') {
      console.log('processValue: Ugh, what did you send in this time:', value);

      return null;
    }

    return value;
  }

  // Read all the submissions in the replica person then
  for (const field of replica_fields) {
    if (replica_person_meta[field] && replica_person_meta[field].history) {
      for (const key of Object.keys(replica_person_meta[field].history)) {
        const submission = replica_person_meta[field].history[key];

        if (meta_changes[field] && meta_changes[field].history) {
          meta_changes[field].history.push(submission);
        } else {
          console.log('Adding new field to schema:', field);
          meta_changes[field] = { history: [submission] };
        }
      }
    }
  }

  const master_fields = Object.keys(meta_changes);

  for (const field of master_fields) {
    if (meta_changes[field] && meta_changes[field].history) {
      meta_changes[field].history = _.map(
        meta_changes[field].history,
        submission => ({
          ...submission,
          date: submission.date.toDate(),
          value: processValue(submission.value),
        })
      );
      meta_changes[field].history = _.uniqBy(
        meta_changes[field].history,
        'source'
      );
      meta_changes[field].history = _.orderBy(
        meta_changes[field].history,
        ['date'],
        ['asc']
      );
    }
  }

  return meta_changes;
}

/**
 * Given 2 person IDs which should be merged, determine which is primary,
 * merge fields into it, verify merge worked, delete old person record.
 * Currently the person record created first is the Primary and will be merged into
 * (this could be changed to different logic if needed in the future)
 * @param person_id1 {FiredUp.person}
 * @param person_id2 {FiredUp.person}
 */
export async function merge(person1_id: string, person2_id: string) {
  try {
    if (person1_id === person2_id) {
      throw new Error(`Both Person ID arguments are the same`);
    }

    let master_person, replica_person;
    let master_person_id, replica_person_id;

    const person1_doc = await firestore
      .collection('people')
      .doc(person1_id)
      .get();
    const person2_doc = await firestore
      .collection('people')
      .doc(person2_id)
      .get();

    const person1_data = person1_doc.data();
    const person2_data = person2_doc.data();

    // Switch from using person1/person2 to using master_person/replica_person variable naming
    // We're chosing the master record based on creation date
    if (person1_data.created_at.toDate() === person2_data.created_at.toDate()) {
      throw new Error(
        `Created At dates match for ${person1_id} and ${person2_id}. Unable to reconcile.`
      );
    } else if (
      person1_data.created_at.toDate() > person2_data.created_at.toDate()
    ) {
      master_person_id = person2_id;
      replica_person_id = person1_id;
      master_person = person2_data;
      replica_person = person1_data;
    } else {
      master_person_id = person1_id;
      replica_person_id = person2_id;
      master_person = person1_data;
      replica_person = person2_data;
    }

    // Calculate some totals from each person records meta so we can verify task success later
    const master_person_original_meta_stats = parsePreviousSubmissions(
      master_person.meta
    );
    const replica_person_original_meta_stats = parsePreviousSubmissions(
      replica_person.meta
    );

    //console.log( 'master', master_person_original_meta_stats );
    //console.log( 'replica', replica_person_original_meta_stats );

    // Get the sum of submissions counts for both people then add them together so we can later
    // determine if the merged person reports the exact total submissions count expected in merge
    const submissions_expected_total =
      master_person_original_meta_stats.submissions_count +
      replica_person_original_meta_stats.submissions_count;

    // Clone the master person, merge the metas
    const master_person_prewrite = _.cloneDeep(master_person);
    master_person_prewrite.meta = joinPersonMeta(
      master_person.meta,
      replica_person.meta
    );

    // Calculate stats for merged meta object
    const master_person_prewrite_meta_stats = parsePreviousSubmissions(
      master_person_prewrite.meta
    );

    // Determine whether the merge was a success by seeing if the total submissions is increased by the diff amount
    if (
      submissions_expected_total ===
      master_person_prewrite_meta_stats.submissions_count
    ) {
      console.log('Pre-write merge count verified, writing changes');

      const master_person_ref = firestore
        .collection('people')
        .doc(master_person_id);

      // Write the updated meta object back to master person
      await master_person_ref.update({ meta: master_person_prewrite.meta });

      const master_person_doc = await master_person_ref.get();
      const master_person_updated_data = master_person_doc.data();

      // Calculate stats for newlywritten meta object
      const master_person_postwrite_meta_stats = parsePreviousSubmissions(
        master_person_updated_data.meta
      );

      if (
        submissions_expected_total ===
        master_person_postwrite_meta_stats.submissions_count
      ) {
        console.log(
          'Post-write merge count verified, updating primary fields and deleting duplicate person record'
        );

        // Now that we're sure the new person record is good, re-calculate top level fields from meta.
        const master_person_regenerated_data = calculatePrimaryFields(
          master_person_updated_data
        );

        await master_person_ref.update({
          ...master_person_regenerated_data,
          updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Finally, delete the replica person record
        await firestore
          .collection('people')
          .doc(replica_person_id)
          .delete();

        await firestore
          .collection('people_simple')
          .doc(replica_person_id)
          .delete();

        return {
          status: 'success',
          message: `Merged ${replica_person_id} into ${master_person_id}. Deleted ${replica_person_id}`,
        };
      } else {
        console.error('Post-write merge count mis-match, aborting');
      }
    } else {
      console.error('Pre-write merge count mis-match, aborting');

      console.error(
        'Expected',
        master_person_original_meta_stats.submissions_count +
          submissions_expected_total,
        'Actual',
        master_person_prewrite_meta_stats.submissions_count
      );
    }

    return {
      status: 'Failure',
      message: `Merging not complete, no data has been deleted`,
    };
  } catch (error) {
    throw error;
  }

  // [x] get person1
  // [x] get person2
  // [x] determine master record by which has first start date
  // [x] parse submissions
  // [x] join person meta
  // [ ] write back to selected person
  // [ ] verify selected person meta contains the count of two metas
  // [ ] calculate primary fields for selected person
  // [ ] delete orphaned record
}

export default {
  merge,
  findMatchesBy,
};
