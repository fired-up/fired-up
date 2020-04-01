import * as functions from 'firebase-functions';

import { getAutoresponder } from './library/autoresponders';
import { verifySuperAdminStatus } from '../../fired-up-admin/functions/library/admin';
import { sendAutoresponder } from '../../fired-up-sendgrid/functions/library/sendgrid';

export const autoresponderPreview = functions.https.onCall(
  async (data, context) => {
    if (!verifySuperAdminStatus(context)) {
      return { status: 'UNAUTHENTICATED' };
    }

    try {
      const autoresponder = await getAutoresponder(data.autoresponderID);

      await sendAutoresponder(autoresponder, data.email);
      return { status: 'OK' };
    } catch (err) {
      return { ...err, status: 'Server error' };
    }
  }
);

// TODO: convert the function calls to this to the above
export const sendPreviewAutoresponder = autoresponderPreview;
