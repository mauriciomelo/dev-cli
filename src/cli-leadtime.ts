#!/usr/bin/env node

import { Options, writePoints } from './leadTime';
const { program } = require('./program');

program
  .command('leadtime')
  .description('lead time for changes')
  .option('--influxdb', 'saves output to influxdb')
  .option('--csv', 'outputs a csv file')
  .option('--json', 'outputs a JSON file')

  .action(({ json, csv, influxdb }: Options) => {
    writePoints({ json, csv, influxdb });
  });
