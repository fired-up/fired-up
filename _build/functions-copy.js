#!/usr/bin/env node

const fs = require('fs-extra');

const chalk = require('chalk');
const git = require('simple-git/promise')();

const main = (async () => {
  try {
    /**
     * - Ensure working directory is clean so we can use `git reset`
     *   to restore changes made to the project root's `functions` directory
     */
    const result = await git.status();

    console.log('Git Status', result.files.length);

    for ( const file of result.files ) {
      console.log( file.path );
      if ( file.path.indexOf('functions/') === 0 ) {
        return new Error('Fired Up Deploy Error: please ensure all changes to functions/* are committed before deploying')
      }
    }

    const packagesQueue = [];

    // Read over every packge to see which are eligible for functions copying
    const packagesDirectory = fs.readdirSync('./packages', {
      withFileTypes: true,
    });

    for (const item of packagesDirectory) {
      if (item.isDirectory()) {
        const packageName = item.name;
        const packageDirectory = fs.readdirSync(`./packages/${packageName}`);

        if (
          packageDirectory.indexOf('functions') !== -1 &&
          packageDirectory.indexOf('config.json') !== -1
        ) {
          console.log(`${packageName} will be processed`);

          packagesQueue.push(packageName);
        } else if (packageDirectory.indexOf('functions') !== -1) {
          console.log(`${packageName} needs a config.json to be processed`);
        } else if (packageDirectory.indexOf('config.json') !== -1) {
          console.log(
            `${packageName} needs a functions folder to be processed`
          );
        }
      }
    }

    // Copy over the files for each package
    for (const package of packagesQueue) {
      await fs.ensureDir(`./functions/src/packages/${package}/functions/`);
      await fs.copy(`./packages/${package}/functions/`, `./functions/src/packages/${package}/functions/`);
      await fs.copy(`./packages/${package}/config.json`, `./functions/src/packages/${package}/config.json`);
    }
  } catch (error) {
    const output = error && error.message ? error.message : error;
    console.error(chalk.bold.red(output));
    process.exit(1);
  }
})();
