#!/usr/bin/env node

const fs = require('fs-extra');

const main = (async () => {
  const packages = await fs.readdir('./packages');

  for ( const package of packages ) {
    console.log(`Copying packages for ${package}`);

    try {
      await fs.mkdir(`./functions/lib/packages/${ package }/functions/node_modules`);
      await fs.copy(`./packages/${ package }/config.json`, `./functions/lib/packages/${ package }/config.json`);
      await fs.copy(`./packages/${ package }/functions/node_modules`, `./functions/lib/packages/${ package }/functions/node_modules`)
    } catch ( error ) {}
  }
})();
