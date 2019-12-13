#!/usr/bin/env node

const { collaborators } = require('./collaborators');

const { program } = require('./program');

const chalk = require('chalk');
const inquirer = require('inquirer');
var fuzzy = require('fuzzy');
const { intersection, isEmpty } = require('ramda');
const shell = require('shelljs');
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
    (message, pair) =>
      `${message}\nCo-authored-by: ${collaborators[pair].name} <${collaborators[pair].email}>`,
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

const promptQuestions = () => {
  const emojiChoices = Object.keys(EMOJI_LIST);
  const collaboratorsChoices = [NO_PAIR].concat(Object.keys(collaborators));
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
      default: 'SP-000',
      validate: input => !!input,
    },
    {
      type: 'checkbox-plus',
      name: 'pairing',
      message: 'pairing with',
      pageSize: 20,
      highlight: true,
      searchable: true,
      validate: input => !isEmpty(input),
      source: function(answersSoFar, input) {
        input = input || '';

        return new Promise(function(resolve) {
          var fuzzyResult = fuzzy.filter(input, collaboratorsChoices);

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

const commitCommand = program.action(options => {
  if (options.message) {
    const story = branchPrefix();
    const emojis = intersection(
      Object.keys(options),
      Object.keys(EMOJI_LIST)
    ).map(emoji => EMOJI_LIST[emoji].code);
    const message = options.message;
    commit({ message, story, emojis, amend: options.amend });
  } else {
    inquirer.prompt(promptQuestions()).then(result => {
      commit(Object.assign({}, result, { amend: options.amend }));
    });
  }
});

addEmojiFlags();

program.parse(process.argv);
