import { cloneDeep as _cloneDeep } from 'lodash';
import people from '../../../../fired-up-people/functions/library/people';
import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

export default async function(originalSignup: FiredUp.Signup, id: string) {
  try {
    const signup = _cloneDeep(originalSignup);
    const fields = _cloneDeep(signup.fields);

    const { id: person_id } = await people.findUpdateOrCreate(
      fields.token || null,
      fields.email_address,
      signup,
      'signup',
      id
    );

    return { person_id };
  } catch (error) {
    console.error(error);
    return {};
  }
}
