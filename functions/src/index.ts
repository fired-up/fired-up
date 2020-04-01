import dns from 'dns';
import * as path from 'path';
import * as fs from 'fs';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';

require('dnscache')({
  enable: true,
  ttl: 300,
  cachesize: 1000
});

try {
  firebase.initializeApp();
} catch (error) {}

let compiled = {};

fs.readdirSync(path.resolve(__dirname, 'packages')).forEach(file => {
  const pkg = require(`./packages/${ file }/functions/index.js`);

  compiled = {
    ...compiled,
    ...pkg
  }
});

module.exports = compiled


///// DO NOT COMMIT - The below was auto-inserted from the functions in Fired Up Packages /////

