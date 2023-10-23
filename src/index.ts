import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {subgraphCommand} from './commands/subgraph';

yargs(hideBin(process.argv))
  .scriptName('forge-utils')
  .command(subgraphCommand)
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .parse();
