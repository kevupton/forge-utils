import {CommandModule} from 'yargs';
import {appendMetaToBroadcastFiles} from '../scripts/append-meta-to-broadcasts-files';
import path from 'path';

export const appendMetaCommand: CommandModule = {
  command: 'append-meta',
  describe: 'Appends meta information to Forge broadcast JSON files',
  builder: {
    dir: {
      describe: 'Directory containing broadcast files',
      type: 'string',
      default: path.join(process.cwd(), 'broadcast'),
    },
    meta: {
      describe: 'Meta information to append (e.g., meta.env=staging)',
      type: 'array',
      default: [],
    },
    newFiles: {
      describe: 'Only process files that are new to Git',
      type: 'boolean',
      default: false,
    },
  },
  handler: (argv: any) => {
    appendMetaToBroadcastFiles({
      dir: argv.dir,
      meta: argv.meta,
      newFilesOnly: argv.newFiles,
    });
  },
};
