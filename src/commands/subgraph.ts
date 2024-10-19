import {generateNetworksJson} from '../scripts/generate-networks-json';
import {CommandModule} from 'yargs';

export const subgraphCommand: CommandModule = {
  command: 'subgraph <package> [env]',
  describe: 'Generates a networks.json based on the forge deployment scripts',
  builder: yargs => {
    return yargs
      .positional('package', {
        describe:
          'Either an NPM package or path to the directory of the forge build artifacts',
        type: 'string',
      })
      .positional('env', {
        describe:
          'The environment to filter deployments (e.g., staging, production)',
        type: 'string',
        default: 'default',
      })
      .option('output', {
        describe: 'Where to output the networks.json to',
        type: 'string',
        default: process.cwd(),
      })
      .option('dir', {
        describe: 'The folder where the broadcast directory is located',
        type: 'string',
        default: 'broadcast',
      });
  },
  handler: (argv: any) => {
    generateNetworksJson(argv);
  },
};
