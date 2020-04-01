import { getForm, incrementFormCounter } from '../signups';
import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

export default async function(signup: FiredUp.Signup) {
  try {
    const form = await getForm(signup.form_id);
    await incrementFormCounter(signup.form_id);
  } catch (error) {}

  return {};
}
