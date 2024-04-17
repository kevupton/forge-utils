import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {subgraphCommand} from './commands/subgraph';
import {deploymentsCommand} from './commands/deployments';
import {cleanTypechainBytecodeCommand} from './commands/clean-typechain-bytecode';

yargs(hideBin(process.argv))
  .scriptName('forge-utils')
  .command(subgraphCommand)
  .command(deploymentsCommand)
  .command(cleanTypechainBytecodeCommand)
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .parse();
