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

interface Receipt {
  transactionHash: string;
  blockNumber: string;
  logs?: Log[];
}

interface Log {
  address: string;
  topics: string[];
  data: string;
}

interface Data {
  transactions: Transaction[];
  receipts: Receipt[];
  timestamp: number;
  meta?: {
    env?: string;
  };
}

type DeploymentConfig = Record<string, Record<string, Record<string, string>>>;

interface Options {
  output: string;
  dir: string;
}

const contractTimestamps: Record<string, Record<string, number>> = {};
const contractNames: Record<string, Record<string, string>> = {};
const implementationAddresses: Record<string, Set<string>> = {};
const implementationFor: Record<string, Record<string, string>> = {};

export function generateDeploymentsJson({output, dir}: Options) {
  const inputDir = path.join(dir, '**/*.json');

  const files = sync(inputDir).filter(file => file.endsWith('.json'));

  const deploymentsPath =
    fs.existsSync(output) && fs.statSync(output).isDirectory()
      ? path.join(output, 'deployments.json')
      : output;

  const loadConfig = (): DeploymentConfig => {
    try {
      return fs.existsSync(deploymentsPath)
        ? JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'))
        : {};
    } catch (e) {
      return {};
    }
  };

  const config: DeploymentConfig = loadConfig();

  const receipts: Receipt[] = [];
  // Preload all file contents
  const txs = files
    .flatMap(file => {
      const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Data;
      const pieces = file.split('/');
      const chainId = pieces[pieces.length - 2];
      const env = data.meta?.env || 'default';

      if (!contractNames[chainId]) contractNames[chainId] = {};
      if (!implementationAddresses[chainId])
        implementationAddresses[chainId] = new Set();

      if (!config[env]) config[env] = {};
      if (!config[env][chainId]) config[env][chainId] = {};
      if (!contractTimestamps[chainId]) contractTimestamps[chainId] = {};
      if (!implementationFor[chainId]) implementationFor[chainId] = {};

      receipts.push(...data.receipts);

      return data.transactions.map(tx => ({tx, env, chainId, data}));
    })
    .sort((a, b) => a.data.timestamp - b.data.timestamp);

  // First pass: save all contract names and implementation addresses
  txs.forEach(({tx, chainId}) => {
    if (tx.contractName && tx.contractAddress) {
      contractNames[chainId][tx.contractAddress.toLowerCase()] =
        tx.contractName;
      if (tx.contractName.endsWith('Implementation')) {
        implementationAddresses[chainId].add(tx.contractAddress.toLowerCase());
      }
    }
  });

  // Second pass: process upgrades and deployments
  txs.forEach(({tx, chainId, env}) => {
    const receipt = receipts.find(r => r.transactionHash === tx.hash);
    if (!receipt || !receipt.logs) return;
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
          contractNames[chainId][implementationAddress];
        if (implementationName) {
          const baseName = implementationName.replace('Implementation', '');
          config[env][chainId][`${baseName}Implementation`] =
            implementationAddress;
          implementationAddresses[chainId].add(implementationName);

          const proxyAddress = log.address.toLowerCase();
          implementationFor[chainId][proxyAddress] = baseName;
        }
      }
    });
  });

  txs.forEach(({tx, chainId, data, env}) => {
    if (tx.contractName && tx.contractAddress && tx.hash) {
      contractTimestamps[chainId][tx.contractName] = data.timestamp;
      const contractAddress = tx.contractAddress.toLowerCase();

      if (tx.contractName === 'TransparentUpgradeableProxy') {
        const baseName = implementationFor[chainId][contractAddress];
        config[env][chainId][baseName] = contractAddress;
      } else if (!implementationAddresses[chainId].has(tx.contractName)) {
        config[env][chainId][tx.contractName] = contractAddress;
      }
    }
  });

  // Remove empty objects before writing to file
  Object.keys(config).forEach(env => {
    Object.keys(config[env]).forEach(chainId => {
      if (Object.keys(config[env][chainId]).length === 0) {
        delete config[env][chainId];
      }
    });
    if (Object.keys(config[env]).length === 0) {
      delete config[env];
    }
  });

  fs.writeFileSync(deploymentsPath, JSON.stringify(config, null, 2));
}
