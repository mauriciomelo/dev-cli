#!/usr/bin/env node

const columnify = require('columnify');

const { program } = require('./program');

const { getMyLastCommitScope } = require('./lastCommitScope');

const chalk = require('chalk');
const inquirer = require('inquirer');
const fuzzy = require('fuzzy');
const { intersection, isEmpty, prop, uniqBy } = require('ramda');
const { getLastCommiters } = require('./lastCommiters');
const { commit, COMMIT_TYPES, NO_PAIR } = require('./commit');
inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt')
);

function getTypes() {
  const types = Object.keys(COMMIT_TYPES).map(key => ({
    value: key,
    icon: COMMIT_TYPES[key].icon,
    description: COMMIT_TYPES[key].description,
  }));

  const names = columnify(types, {
    columns: ['value', 'icon', 'description'],
    showHeaders: false,
  }).split('\n');

  const choices = types.map(({ value }, index) => ({
    value,
    name: names[index],
  }));
  return choices;
}

const addEmojiFlags = () =>
  Object.keys(COMMIT_TYPES).forEach(emoji => {
    commitCommand.option(
      `--${emoji}`,
      `${COMMIT_TYPES[emoji].icon} ${COMMIT_TYPES[emoji].description}`
    );
  });

const promptQuestions = ({ scope }) => {
  return [
    {
      type: 'list',
      name: 'type',
      message: 'type',
      choices: getTypes(),
    },
    {
      type: 'input',
      name: 'message',
      message: 'message',
      validate: input => !!input,
    },
    {
      type: 'input',
      name: 'story',
      message: 'story',
      default: scope,
      validate: input => !!input,
    },
    {
      type: 'checkbox-plus',
      name: 'pairing',
      message: 'Co-authors',
      pageSize: 5,
      highlight: true,
      searchable: true,
      validate: input => !isEmpty(input),
      source: async function(answersSoFar, input) {
        const lastCommiters = await getLastCommiters();
        const unique = uniqBy(prop('email'), lastCommiters);
        const choices = [NO_PAIR].concat(
          unique.map(({ name, email }) => `${name} <${email}>`)
        );

        input = input || '';

        return new Promise(function(resolve) {
          var fuzzyResult = fuzzy.filter(input, choices);

          var data = fuzzyResult.map(function(element) {
            return element.original;
          });

          resolve(data);
        });
      },
    },
  ];
};

const commitCommand = program
  .command('commit')
  .alias('c')
  .action(async options => {
    if (options.message) {
      const story = branchPrefix();
      const emojis = intersection(
        Object.keys(options),
        Object.keys(COMMIT_TYPES)
      ).map(emoji => COMMIT_TYPES[emoji].code);
      const message = options.message;
      commit({ message, story, emojis, amend: options.amend });
    } else {
      const scope = await getMyLastCommitScope();
      inquirer.prompt(promptQuestions({ scope })).then(result => {
        commit(Object.assign({}, result, { amend: options.amend }));
      });
    }
  });

addEmojiFlags();

// program.parse(process.argv);
