import {CommandModule} from 'yargs';
import {generateDeploymentsJson} from '../scripts/generate-deployments-json';

export const deploymentsCommand: CommandModule = {
  command: 'deployments',
  describe:
    'Generates a deployments.json based on the forge deployment scripts',
  builder: {
    dir: {
      describe: 'Directory of forge build',
      type: 'string',
      default: process.cwd(),
    },
    output: {
      describe: 'Where to output the networks.json to',
      type: 'string',
      default: process.cwd(),
    },
  },
  handler: (argv: any) => {
    generateDeploymentsJson(argv);
  },
};
