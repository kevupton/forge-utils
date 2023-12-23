import {generateNetworksJson} from '../scripts/generate-networks-json';
import {CommandModule} from 'yargs';

export const subgraphCommand: CommandModule = {
  command: 'subgraph',
  describe: 'Generates a networks.json based on the forge deployment scripts',
  builder: yargs => {
    return yargs
      .positional('package', {
        describe:
          'Either an NPM package or path to the directory of the forge build artifacts',
        type: 'string',
      })
      .option('output', {
        describe: 'Where to output the networks.json to',
        type: 'string',
        default: process.cwd(),
      });
  },
  handler: (argv: any) => {
    generateNetworksJson(argv);
  },
};
