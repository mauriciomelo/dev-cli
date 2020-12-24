#!/usr/bin/env node

const { collaborators } = require('../collaborators');

const { program } = require('./program');

const { getMyLastCommitScope } = require('./lastCommitScope');

const chalk = require('chalk');
const inquirer = require('inquirer');
var fuzzy = require('fuzzy');
const { intersection, isEmpty, prop, uniqBy, eqProps } = require('ramda');
const shell = require('shelljs');
const { getLastCommiters } = require('./lastCommiters');
inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt')
);

const EMOJI_LIST = {
  feat: { image: '✨', code: ':sparkles:', description: 'add new feature' },
  fix: { image: '🐛', code: ':bug:', description: 'fix bug' },
  chore: {
    image: '🔧',
    code: ':wrench:',
    description: 'updating script tasks etc; no production code change',
  },
  doc: { image: '📚', code: ':books:', description: 'add documentation' },
  test: { image: '✅', code: ':white_check_mark:', description: 'add test' },
  style: {
    image: '🎨',
    code: ':art:',
    description: 'update UI and style files',
  },
  refactor: { image: '🔨', code: ':hammer:', description: 'refactor code' },
  i18n: {
    image: '🌐',
    code: ':globe_with_meridians:',
    description: 'add globalization/internationalization code',
  },
  log: { image: '🔊', code: ':loud_sound:', description: 'add log' },
  unlog: { image: '🔇', code: ':mute:', description: 'remove log' },
};

const NO_PAIR = 'None';

const exec = (cmd, options) => {
  const execution = shell.exec(cmd, options);
  process.exitCode = execution.code;
  return execution;
};

const commit = ({ story, message, type, amend, pairing }) => {
  const emoji = EMOJI_LIST[type].code;
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
  const messageWithImages = Object.keys(EMOJI_LIST).reduce((message, emoji) => {
    return message.replace(EMOJI_LIST[emoji].code, EMOJI_LIST[emoji].image);
  }, commitMessageWithPair);
  console.log(chalk.bold[color](messageWithImages));
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
  Object.keys(EMOJI_LIST).forEach(emoji => {
    commitCommand.option(
      `--${emoji}`,
      `${EMOJI_LIST[emoji].image} ${EMOJI_LIST[emoji].description}`
    );
  });

const promptQuestions = ({ scope }) => {
  const emojiChoices = Object.keys(EMOJI_LIST);

  return [
    {
      type: 'list',
      name: 'type',
      message: 'type',
      choices: emojiChoices,
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
        const people = Object.values(collaborators).concat(lastCommiters);
        const unique = uniqBy(prop('email'), people);
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
    {
      type: 'input',
      name: 'message',
      message: 'message',
      validate: input => !!input,
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
        Object.keys(EMOJI_LIST)
      ).map(emoji => EMOJI_LIST[emoji].code);
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
