import {CommandModule} from 'yargs';
import {generateDeploymentsJson} from '../scripts/generate-deployments-json';
import path from 'path';

export const deploymentsCommand: CommandModule = {
  command: 'deployments',
  describe:
    'Generates a deployments.json based on the forge deployment scripts',
  builder: {
    dir: {
      describe: 'Directory of forge broadcast files',
      type: 'string',
      default: path.join(process.cwd(), 'broadcast'),
    },
    output: {
      describe: 'Where to output the deployments.json to',
      type: 'string',
      default: process.cwd(),
    },
  },
  handler: (argv: any) => {
    generateDeploymentsJson(argv);
  },
};
