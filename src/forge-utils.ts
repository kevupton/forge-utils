import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {subgraphCommand} from './commands/subgraph';
import {deploymentsCommand} from './commands/deployments';
import {cleanTypechainBytecodeCommand} from './commands/clean-typechain-bytecode';
import {appendMetaCommand} from './commands/append-meta';
import {recordMetaCommand} from './commands/record-meta';

yargs(hideBin(process.argv))
  .scriptName('forge-utils')
  .command(subgraphCommand)
  .command(appendMetaCommand)
  .command(deploymentsCommand)
  .command(cleanTypechainBytecodeCommand)
  .command(recordMetaCommand)
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .parse();
