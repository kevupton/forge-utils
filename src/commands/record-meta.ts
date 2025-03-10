import {CommandModule} from 'yargs';
import {recordMeta} from '../scripts/record-meta';
import {FORGE_UTILS_DIR} from '../utils/constants';

export const recordMetaCommand: CommandModule = {
  command: 'record-meta <key> <value>',
  describe: 'Records metadata that can be used by the append-meta command',
  builder: {
    key: {
      describe: 'The key to identify the metadata',
      type: 'string',
      demandOption: true,
    },
    value: {
      describe: 'The value to record',
      type: 'string',
      demandOption: true,
    },
    output: {
      describe: 'Directory to store the meta.json file',
      type: 'string',
      default: FORGE_UTILS_DIR,
    },
  },
  handler: (argv: any) => {
    recordMeta(argv);
  },
};
