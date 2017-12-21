const p2a = require('./library/phone2action.js');
const functions = require('firebase-functions');


/*

    Eventually (after things are published in NPM) this should allow dynamically loading libraries

*/

//////////////////
// Phone2Action //
//////////////////

exports.P2ACall = functions.https.onRequest(p2a.call);
exports.P2AEmail= functions.https.onRequest(p2a.email);