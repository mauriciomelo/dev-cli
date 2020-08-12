#!/usr/bin/env node

const { program, exec } = require('./program');
const path = require('path');

const rootPath = path.join(__dirname, '/../cli');
const run = exec(rootPath);

program
  .command('update')
  .description('update the CLI')
  .action(() => {
    run(
      `
    git pull -r &&
    npm install &&
    npm unlink && npm link
    `
    );
  });

// program.parse(process.argv);
