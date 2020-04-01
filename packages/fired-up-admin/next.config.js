if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './.env' });
} else {
  require('dotenv').config({ path: './.env.production' });
}

const path = require('path');
const glob = require('glob');
const withSass = require('@zeit/next-sass');
const withTM = require('next-transpile-modules');

module.exports = withSass(
  withTM({
    transpileModules: [
      'fired-up-core',
      'fired-up-utils',
      'fired-up-forms',
      'dashboard',
      'fired-up-autoresponders',
    ],
    env: {
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
      GOOGLE_MAPS_KEY: process.env.GOOGLE_MAPS_KEY,
      INTERCOM_APP_ID: process.env.INTERCOM_APP_ID,
      STACKDRIVER_API: process.env.STACKDRIVER_API,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
      CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    },
    sassLoaderOptions: {
      includePaths: ['styles', '../../node_modules']
        .map(d => path.join(__dirname, d))
        .map(g => glob.sync(g))
        .reduce((a, c) => a.concat(c), []),
    },
    webpack: config => {
      config.plugins = config.plugins.filter(plugin => {
        if (plugin.constructor.name === 'ForkTsCheckerWebpackPlugin')
          return false;
        return true;
      });

      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        loader: 'worker-loader',
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      });

      // Overcome webpack referencing `window` in chunks
      config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`;

      return config;
    },
  })
);
