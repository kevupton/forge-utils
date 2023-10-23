const yargs = require('yargs');
const subgraph = require('./commands/subgraph');

yargs
  .scriptName('forge-utils')
  .command(subgraph)
  .demandCommand(1, 'You need at least one command before moving on')
  .help().argv;
