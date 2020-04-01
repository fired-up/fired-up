#!/usr/bin/env node

const fs = require('fs-extra');
const chalk = require('chalk');
const git = require('simple-git/promise')();

const main = (async () => {
  try {
    await git.checkout(['--', 'functions']);
    await fs.remove(`./functions/src/packages`);
    await fs.remove(`./functions/src/config`);
  } catch (error) {
    const output = error && error.message ? error.message : error;
    console.error(chalk.bold.red(output));
    process.exit(1);
  }
})();
