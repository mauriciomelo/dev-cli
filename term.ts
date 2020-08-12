import * as module from './hello';
const { program, parse } = require('./program');

type Cmd = module.Cmd & { name: string };

const commands: Cmd[] = Object.keys(module).map(key => ({
  name: key,
  ...module[key],
}));

commands.forEach(cmd => {
  program
    .command(cmd.name)
    .alias(cmd.alias)
    .description(cmd.description)
    .action(cmd.action);
});

parse();
