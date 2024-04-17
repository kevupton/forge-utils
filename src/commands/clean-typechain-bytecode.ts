import {CommandModule} from 'yargs';
import {removeBytecode} from '../scripts/remove-bytecode';
import path from 'path';

export const cleanTypechainBytecodeCommand: CommandModule = {
  command: 'clean-typechain-bytecode [path]',
  describe: 'Removes all the bytecodes from all of the typechain factories',
  builder: yargs => {
    return yargs.positional('path', {
      describe: 'The path to the folder to clean the bytecode from',
      type: 'string',
      default: path.join(process.cwd(), 'typechain'),
    });
  },
  handler: (argv: any) => {
    removeBytecode(argv.path);
  },
};
