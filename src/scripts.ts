#!/usr/bin/env node

import { parsePackage } from './parsePackageJson';
const fs = require('fs');
const path = require('path');
import './cli-commit';
import './cli-clone';
import './cli-update';
const { program, parse } = require('./program');

let packageJSON = JSON.parse(fs.readFileSync(path.resolve('./package.json')));

parsePackage(packageJSON).forEach(cmd => {
  program
    .command(cmd.name)
    .alias(cmd.alias)
    .action(cmd.action);
});

parse();
