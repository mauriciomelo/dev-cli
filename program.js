const program = require('commander');
const chalk = require('chalk');
const { isNil, curry } = require('ramda');
const shell = require('child_process');

program.on('command:*', function(command) {
  const availableCommands = this.commands.flatMap(({ _alias, _name }) => [
    _alias,
    _name,
  ]);

  const isSupported =
    availableCommands.some(c => c === command[0]) || isNil(command);

  if (isSupported) {
    return;
  }

  console.error(
    chalk.red(`
      Invalid command: ${chalk.bgRed.white(program.args.join(' '))}
      See --help for a list of available commands.
      `)
  );
  process.exit(1);
});

const parse = () => {
  program.parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp(chalk.yellow);
  }
};

const exec = curry((path, cmd) => {
  console.log(`> ${cmd}`);
  try {
    shell.execSync(cmd, {
      cwd: path,
      stdio: 'inherit',
    });
  } catch (e) {
    process.exitCode = e.status;
  }
});

module.exports = { program, exec, parse };
