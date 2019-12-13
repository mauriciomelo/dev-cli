#!/usr/bin/env node

const { program, exec } = require('./program');
const repositories = require('./repositories');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const rootPath = path.join(__dirname, '/..');
const run = exec(rootPath);

program.action(() => {
  repositories.forEach(repo => {
    const isClonnedAlready = fs.existsSync(path.join(rootPath, repo.name));
    if (isClonnedAlready) {
      console.log(chalk.yellow(`✅   ${repo.name} already exists`));
      return;
    }
    run(`git clone ${repo.path}`);
    console.log(chalk.green(`✅   ${repo.name} cloned`));
  });
});

program.parse(process.argv);
