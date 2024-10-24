import fs from 'fs';
import path from 'path';
import {sync} from 'glob';

interface Transaction {
  contractName?: string;
  contractAddress?: string;
  hash: string;
  function?: string;
  arguments?: string[];
  transactionType?: string;
}

interface Log {
  address: string;
  topics: string[];
  data: string;
}

interface Receipt {
  transactionHash: string;
  blockNumber: string;
  logs?: Log[];
}

interface Data {
  transactions: Transaction[];
  receipts: Receipt[];
  timestamp: number;
  meta?: {
    env?: string;
  };
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
  env?: string;
}

const contractTimestamps: Record<string, Record<string, [number, number]>> = {};
const contractNames: Record<string, Record<string, string>> = {};
const implementationAddresses: Record<string, Set<string>> = {};
const implementationFor: Record<string, Record<string, string>> = {};

export function generateNetworksJson({
  output,
  package: packageDir,
  dir,
  env = 'default',
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
  const receipts: Receipt[] = [];

  // Preload all file contents
  const txs = files
    .flatMap(file => {
      const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Data;
      const pieces = file.split('/');
      const networkId = pieces[pieces.length - 2];
      const networkName = subgraphData[networkId];

      // Skip files that don't match the specified environment
      if ((data.meta?.env ?? 'default') !== env) {
        return [];
      }

      if (!network[networkName]) network[networkName] = {};
      if (!contractTimestamps[networkId]) contractTimestamps[networkId] = {};
      if (!contractNames[networkId]) contractNames[networkId] = {};
      if (!implementationAddresses[networkId])
        implementationAddresses[networkId] = new Set();
      if (!implementationFor[networkId]) implementationFor[networkId] = {};

      receipts.push(...data.receipts);

      return data.transactions.map(tx => ({tx, networkId, networkName, data}));
    })
    .sort((a, b) => a.data.timestamp - b.data.timestamp);

  // First pass: save all contract names and implementation addresses
  txs.forEach(({tx, networkId}) => {
    if (tx.contractName && tx.contractAddress) {
      const lowercaseAddress = tx.contractAddress.toLowerCase();
      contractNames[networkId][lowercaseAddress] = tx.contractName;
      if (tx.contractName.endsWith('Implementation')) {
        implementationAddresses[networkId].add(lowercaseAddress);
      }
    }
  });

  // Second pass: process upgrades and deployments
  txs.forEach(({tx, networkId}) => {
    const receipt = receipts.find(r => r.transactionHash === tx.hash);
    if (receipt && receipt.logs) {
      receipt.logs.forEach(log => {
        if (
          log.topics[0].toLowerCase() ===
          '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b'
        ) {
          // This is the Upgraded event
          const implementationAddress = (
            '0x' + log.topics[1].slice(-40)
          ).toLowerCase();
          const implementationName =
            contractNames[networkId][implementationAddress];
          implementationAddresses[networkId].add(implementationName);

          if (implementationName) {
            const baseName = implementationName.replace('Implementation', '');
            const proxyAddress = log.address.toLowerCase();
            implementationFor[networkId][proxyAddress] = baseName;
          }
        }
      });
    }
  });

  txs.forEach(({tx, networkId, networkName, data}) => {
    const receipt = receipts.find(r => r.transactionHash === tx.hash);
    if (tx.contractName && tx.contractAddress) {
      const currentBlockNumber = +BigInt(
        receipt?.blockNumber || '0'
      ).toString();
      const lowercaseAddress = tx.contractAddress.toLowerCase();

      if (
        currentBlockNumber &&
        (contractTimestamps[networkId][tx.contractName]?.[0] < data.timestamp ||
          !network[networkName]?.[tx.contractName]?.startBlock)
      ) {
        contractTimestamps[networkId][tx.contractName] = [
          data.timestamp,
          currentBlockNumber,
        ];

        if (tx.contractName === 'TransparentUpgradeableProxy') {
          const name = implementationFor[networkId][lowercaseAddress];
          if (name) {
            network[networkName][name] = {
              address: lowercaseAddress,
              startBlock: currentBlockNumber,
            };
          } else {
            console.error('no implementation found', lowercaseAddress);
          }
        } else {
          if (implementationAddresses[networkId].has(tx.contractName)) {
            const baseName = tx.contractName.replace('Implementation', '');
            network[networkName][`${baseName}Implementation`] = {
              address: lowercaseAddress,
              startBlock: currentBlockNumber,
            };
          } else {
            network[networkName][tx.contractName] = {
              address: lowercaseAddress,
              startBlock: currentBlockNumber,
            };
          }
        }
      }
    }
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
  11155111: 'sepolia',
  1442: 'polygon-zkevm-testnet',
};
