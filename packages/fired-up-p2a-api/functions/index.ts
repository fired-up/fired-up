import * as Cors from 'cors';
import * as functions from 'firebase-functions';
import * as phone2action from './library/phone2action';

const cors = Cors({ origin: true });

exports.p2acall = functions.https.onRequest((req, res) => {
  console.log('Started P2ACall');
  cors(req, res, async () => {
    try {
      const result = await phone2action.createCall(req.body);
      res.send(result);
    } catch (err) {
      res.status(400).send(err);
    }
  });
});

exports.p2aemail = functions.https.onRequest((req, res) => {
  console.log('Started P2AEmail');
  cors(req, res, async () => {
    try {
      const result = await phone2action.sendEmail(req.body);
      res.send(result);
    } catch (err) {
      res.status(400).send(err);
    }
  });
});
