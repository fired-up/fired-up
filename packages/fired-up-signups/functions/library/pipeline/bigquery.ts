import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';
import { writeFiredUpSignup } from '../../../../fired-up-bigquery/functions/library/bigquery';

export default async function(signup: FiredUp.Signup, id: string) {
  await writeFiredUpSignup(signup, id);

  return {};
}
