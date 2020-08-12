import * as path from 'path';

const { exec } = require('./program');
const rootPath = path.resolve('.');
const run = exec(rootPath);

type Cmd = { name: string; alias: string; action: Function };

interface PackageJSON {
  scripts: { [key: string]: string };
}
export function parsePackage(packageJSON: PackageJSON) {
  const commandNames = Object.keys(packageJSON.scripts);

  const commands = commandNames.reduce<Cmd[]>(
    (acc: Cmd[], name: string): Cmd[] => {
      return acc.concat({
        name,
        alias: getAlias(acc, name),
        action: () => run(`npm run ${name}`),
      });
    },
    []
  );

  return commands;
}

const getAlias = (prevCommands: Cmd[], name: string): string => {
  const isDuplicated = prevCommands.some(
    ({ alias }) => alias === getAlias([], name)
  );
  if (isDuplicated) {
    return;
  }
  return name
    .split(':')
    .map(section => section[0])
    .join('');
};
