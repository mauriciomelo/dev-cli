import chalk from 'chalk';
import { isEmpty } from 'ramda';
import * as shell from 'shelljs';

export const NO_PAIR = 'None';

export const COMMIT_TYPES = {
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
} as const;

type CommitTypes = keyof typeof COMMIT_TYPES;

interface Commit {
  story: string;
  message: string;
  type: CommitTypes;
  amend: boolean;
  pairing: string[];
}
export const commit = ({ story, message, type, amend, pairing }: Commit) => {
  const emoji = COMMIT_TYPES[type].code;
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
  const messageWithicons = (Object.keys(COMMIT_TYPES) as CommitTypes[]).reduce(
    (message: string, type: CommitTypes) => {
      return message.replace(COMMIT_TYPES[type].code, COMMIT_TYPES[type].icon);
    },
    commitMessageWithPair
  );
  console.log(chalk.bold[color](messageWithicons));
  process.exitCode = code;
};

function buildmessageWithPairs(
  pairs: string[] | undefined,
  commitMessage: string
): string {
  if (isEmpty(pairs) || !pairs) {
    return commitMessage;
  }

  return pairs.reduce(
    (message, pair) => `${message}\nCo-authored-by: ${pair}`,
    `${commitMessage}\n`
  );
}

export function exec(cmd: string) {
  const execution = shell.exec(cmd);
  process.exitCode = execution.code;
  return execution;
}
