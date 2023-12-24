import fs from 'fs';
import path from 'path';
import {sync} from 'glob';

interface Transaction {
  contractName?: string;
  contractAddress?: string;
  hash: string;
}

interface Receipt {
  transactionHash: string;
  blockNumber: string;
}

interface Data {
  transactions: Transaction[];
  receipts: Receipt[];
  timestamp: number;
}

interface ContractDeployment {
  address: string;
  startBlock: number;
}

type NetworkConfig = Record<string, Record<string, ContractDeployment>>;

interface Options {
  output: string;
  package: string;
  dir: string;
}

const contractTimestamps: Record<string, Record<string, [number, number]>> = {};

export function generateNetworksJson({
  output,
  package: packageDir,
  dir,
}: Options) {
  // Modify this path
  let inputDir = path.join(process.cwd(), 'node_modules', packageDir, dir);
  if (!fs.existsSync(inputDir)) {
    inputDir = path.join(process.cwd(), packageDir, dir);
  }
  if (!fs.existsSync(inputDir)) {
    console.error('Cannot find path ' + inputDir);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  inputDir = path.join(inputDir, '**/*.json');

  const files = sync(inputDir).filter(file => file.endsWith('.json'));

  const network: NetworkConfig = {};
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const data: Data = JSON.parse(content);

    const pieces = file.split('/');
    const networkId = pieces[pieces.length - 2];
    const networkName = subgraphData[networkId];
    network[networkName] = network[networkName] || {};
    contractTimestamps[networkId] = contractTimestamps[networkId] || {};

    const receipt = (hash: string): Receipt | undefined =>
      data.receipts.find(receipt => receipt.transactionHash === hash);

    data.transactions.forEach(tx => {
      if (tx.contractName && tx.contractAddress) {
        const r = receipt(tx.hash);
        const currentBlockNumber =
          +BigInt(r?.blockNumber || '0').toString() ||
          contractTimestamps[networkId][tx.contractName]?.[1] ||
          0;

        const prevTimestamp =
          contractTimestamps[networkId][tx.contractName]?.[0] || 0;

        if (
          currentBlockNumber &&
          (prevTimestamp < data.timestamp ||
            !network[networkName]?.[tx.contractName]?.startBlock)
        ) {
          contractTimestamps[networkId][tx.contractName] = [
            data.timestamp,
            currentBlockNumber,
          ];

          network[networkName][tx.contractName] = {
            address: tx.contractAddress,
            startBlock: currentBlockNumber,
          };
        }
      }
    });
  });

  fs.writeFileSync(
    fs.existsSync(output) && fs.statSync(output).isDirectory()
      ? path.join(output, 'networks.json')
      : output,
    JSON.stringify(network, null, 2)
  );
}

const subgraphData: Record<string, string> = {
  1: 'mainnet',
  5: 'goerli',
  10: 'optimism',
  11155420: 'optimism-sepolia',
  420: 'optimism-goerli',
  56: 'bsc',
  77: 'poa-sokol',
  97: 'chapel',
  99: 'poa-core',
  100: 'gnosis',
  122: 'fuse',
  137: 'matic',
  250: 'fantom',
  280: 'zkstark-testnet',
  288: 'bobai',
  1023: 'clover',
  1284: 'moonbeam',
  1285: 'moonriver',
  1287: 'mbase',
  4002: 'fantom-testnet',
  42161: 'arbitrum-one',
  421613: 'arbitrum-goerli',
  421614: 'arbitrum-sepolia',
  42220: 'celo',
  43113: 'fuji',
  43114: 'avalanche',
  44787: 'celo-alfajores',
  80001: 'mumbai',
  1313161554: 'aurora',
  1313161555: 'aurora-testnet',
  1666600000: 'harmony',
  864531: 'base',
  543451: 'scroll-sapolio',
  1101: 'polygon-zkevm',
  324: 'zksync-era',
  1115011: 'sapolio',
  1442: 'polygon-zkevm-testnet',
};
