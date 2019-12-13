#!/usr/bin/env node

const { program, parse } = require('./program');

program.command('commit', 'commit your changes').alias('c');

program.command('clone', 'clone all repositories if needed');

program.command('update', 'update the CLI');

program.command('some-project', 'some project commands').alias('sp');

parse();
