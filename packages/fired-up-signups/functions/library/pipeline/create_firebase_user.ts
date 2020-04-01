import { ensureDashboardUser } from '../../../../fired-up-auth/functions/library/auth';
import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

export default async function(signup: FiredUp.Signup, _id: string) {
  try {
    if (signup.person_id) {
      await ensureDashboardUser(signup.person_id);
    }

    return;
  } catch (error) {
    throw error;
  }
}
