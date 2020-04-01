import * as functions from 'firebase-functions';
import { getRecipientsCount } from '../../fired-up-sendgrid/functions/library/sendgrid';
import { verifySuperAdminStatus } from '../../fired-up-admin/functions/library/admin';

export const sendgridGetRecipientsCount = functions.https.onCall(
  async (data, context) => {
    if (!verifySuperAdminStatus(context)) {
      return { status: 'UNAUTHENTICATED' };
    }

    try {
      const res = await getRecipientsCount(data.query);
      return res;
    } catch (err) {
      console.log(err);
      return { ...err, status: 'Server error' };
    }
  }
);
