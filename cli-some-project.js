#!/usr/bin/env node
const { program, exec, parse } = require('./program');

const run = exec('../some-project');

program
  .command('start')
  .alias('s')
  .description('start app')
  .action(() => {
    run('npm start');
  });

program
  .command('install')
  .alias('i')
  .description('install dependencies')
  .action(() => {
    run('npm install');
  });

program
  .command('test')
  .alias('t')
  .option('--ci', 'disables watch mode (sets CI=true)')
  .description('run unit tests')
  .action(cmd => {
    const ci = cmd.ci ? 'CI=true' : '';
    run(`${ci} npm test`);
  });

parse();
