const getUTMparams = argv => {
  const utms = {
    content: null,
    medium: null,
    source: null,
    term: null,
    name: null,
  };

  if (argv.utm_source) {
    utms.source = argv.utm_source;
  }

  if (argv.utm_medium) {
    utms.medium = argv.utm_medium;
  }

  if (argv.utm_term) {
    utms.term = argv.utm_term;
  }

  if (argv.utm_content) {
    utms.content = argv.utm_content;
  }

  // Per https://www.npmjs.com/package/@segment/utm-params, we save this as name into firestore
  // It's corrected before entering back into BigQuery
  if (argv.utm_campaign) {
    utms.name = argv.utm_campaign;
  }

  return utms;
};

module.exports = {
  getUTMparams,
};
