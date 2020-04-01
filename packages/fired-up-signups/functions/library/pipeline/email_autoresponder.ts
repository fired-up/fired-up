import { getForm, isEmailSubmissionUnique } from '../signups';
import sendgrid from '../../../../fired-up-sendgrid/functions/library/sendgrid';
import statuses from '../../../../fired-up-sendgrid/functions/library/sync-statuses';
import autoresponders from '../../../../fired-up-autoresponders/functions/library/autoresponders';

import { FiredUp } from '../../../../fired-up-typings/functions/typings/firedup';

export default async function(signup: FiredUp.Signup, id: string) {
  try {
    const form = await getForm(signup.form_id);

    const emailSubmissionUnique = await isEmailSubmissionUnique(
      signup.form_id,
      signup.fields.email_address
    );

    if (
      form.autoresponder_id && // Autoresponder Exists
      emailSubmissionUnique && // Email hasn't received an autoresponder for this form before (anti-abuse)
      signup.hygiene_email_validity !== 'invalid' // Email is valid (sendgrid reputation protection)
    ) {
      console.log(
        `Sending autoresponder ID: ${form.autoresponder_id} - ${id ||
          'preview'}`
      );

      const autoresponder = await autoresponders.getAutoresponder(
        form.autoresponder_id
      );

      await sendgrid.sendAutoresponder(
        autoresponder,
        signup.fields.email_address
      );

      return {
        autoresponder_code: statuses.SENDGRID_SENT,
      };
    }
  } catch (error) {
    console.log(
      `Skipping email for signup ${id}: ${
        error && error.message ? error.message : error
      }`
    );
  }

  return {
    autoresponder_code: statuses.SENDGRID_NOT_SENT_DISABLED,
  };
}
