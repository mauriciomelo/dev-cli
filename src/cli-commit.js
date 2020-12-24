#!/usr/bin/env node

const columnify = require('columnify');

const { program } = require('./program');

const { getMyLastCommitScope } = require('./lastCommitScope');

const chalk = require('chalk');
const inquirer = require('inquirer');
const fuzzy = require('fuzzy');
const { intersection, isEmpty, prop, uniqBy } = require('ramda');
const shell = require('shelljs');
const { getLastCommiters } = require('./lastCommiters');
inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt')
);
const TYPES = {
  feat: { icon: '✨', code: ':sparkles:', description: 'A new feature' },
  fix: { icon: '🐛', code: ':bug:', description: 'A bug fix' },
  chore: {
    icon: '🔧',
    code: ':wrench:',
    description: "Other changes that don't modify src or test files",
  },
  docs: {
    icon: '📚',
    code: ':books:',
    description: 'Documentation only changes',
  },
  test: {
    icon: '✅',
    code: ':white_check_mark:',
    description: 'Adding missing tests or correcting existing tests',
  },
  refactor: {
    icon: '🔨',
    code: ':hammer:',
    description: 'A code change that neither fixes a bug nor adds a feature',
  },
};

const NO_PAIR = 'None';

const exec = (cmd, options) => {
  const execution = shell.exec(cmd, options);
  process.exitCode = execution.code;
  return execution;
};

function getTypes() {
  const types = Object.keys(TYPES).map(key => ({
    value: key,
    icon: TYPES[key].icon,
    description: TYPES[key].description,
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

const commit = ({ story, message, type, amend, pairing }) => {
  const emoji = TYPES[type].code;
  const amendOption = amend ? '--amend' : '';
  const commitMessage = `${type}(${story}): ${message} ${emoji}`;
  const commitMessageWithPair = buildmessageWithPairs(
    pairing.filter(pair => pair !== NO_PAIR),
    commitMessage
  );
  const code = exec(
    `git commit ${amendOption} -m "${commitMessageWithPair.trim()}"`
  ).code;
  const color = code === 0 ? 'greenBright' : 'redBright';
  const messageWithicons = Object.keys(TYPES).reduce((message, emoji) => {
    return message.replace(TYPES[emoji].code, TYPES[emoji].icon);
  }, commitMessageWithPair);
  console.log(chalk.bold[color](messageWithicons));
  process.exitCode = code;
};

const buildmessageWithPairs = (pairs, commitMessage) => {
  if (isEmpty(pairs)) {
    return commitMessage;
  }

  return pairs.reduce(
    (message, pair) => `${message}\nCo-authored-by: ${pair}`,
    `${commitMessage}\n`
  );
};

const addEmojiFlags = () =>
  Object.keys(TYPES).forEach(emoji => {
    commitCommand.option(
      `--${emoji}`,
      `${TYPES[emoji].icon} ${TYPES[emoji].description}`
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
      const emojis = intersection(Object.keys(options), Object.keys(TYPES)).map(
        emoji => TYPES[emoji].code
      );
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
