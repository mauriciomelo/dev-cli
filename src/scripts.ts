#!/usr/bin/env node

import { parsePackage } from './parsePackageJson';
const fs = require('fs');
const path = require('path');
import './cli-commit';
import './cli-clone';
import './cli-update';
import { Command } from 'commander';
const { program, parse } = require('./program');

let packageJSON = JSON.parse(fs.readFileSync(path.resolve('./package.json')));

const aliasList = program.commands.map((c: Command) => c._alias);

parsePackage(packageJSON).forEach(cmd => {
  program
    .command(cmd.name)
    .alias(aliasList.includes(cmd.alias) ? undefined : cmd.alias)
    .action(cmd.action);
});

parse();
