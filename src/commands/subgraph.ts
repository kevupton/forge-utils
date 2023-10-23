import {generateNetworkJson} from '../scripts/generate-network-json';

export const subgraphCommand = {
  command: 'subgraph',
  describe: 'Generates a network.json based on the forge deployment scripts',
  builder: {
    dir: {
      describe: 'Directory of forge build',
      type: 'string',
      default: process.cwd(),
    },
    output: {
      describe: 'Where to output the network.json to',
      type: 'string',
      default: process.cwd(),
    },
  },
  handler: (argv: any) => {
    generateNetworkJson(argv);
  },
};
