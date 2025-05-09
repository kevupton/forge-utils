import fs from 'fs';
import path from 'path';
import {sync} from 'glob';
import {getAddress} from 'ethers';
import {DEPLOYMENTS_FILENAME, logger} from '../lib';

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
    deployments?: Record<string, any>;
  };
}

type DeploymentConfig = Record<
  string,
  Record<string, string | Record<string, string>>
>;

interface Options {
  output: string;
  dir: string;
}

const contractTimestamps: Record<string, Record<string, number>> = {};
const contractNames: Record<string, Record<string, string>> = {};
const implementationAddresses: Record<string, Set<string>> = {};
const implementationFor: Record<string, Record<string, string>> = {};

export function generateDeploymentsJson({output, dir}: Options) {
  logger.debug(`Starting generateDeploymentsJson with output: ${output}, dir: ${dir}`);
  const inputDir = path.join(dir, '**/*.json');
  logger.debug(`Looking for files in: ${inputDir}`);

  const files = sync(inputDir).filter(
    file => file.endsWith('.json') && !file.endsWith('run-latest.json')
  );
  logger.debug(`Found ${files.length} JSON files to process`);

  // Determine the output path for deployments.json
  const deploymentsPath =
    fs.existsSync(output) && fs.statSync(output).isDirectory()
      ? path.join(output, DEPLOYMENTS_FILENAME)
      : output;
  logger.debug(`Deployments will be written to: ${deploymentsPath}`);

  const loadConfig = (): DeploymentConfig => {
    try {
      return fs.existsSync(deploymentsPath)
        ? JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'))
        : {};
    } catch (e) {
      logger.debug(`Error loading existing config: ${e}`);
      return {};
    }
  };

  const config: DeploymentConfig = loadConfig();
  logger.debug(`Loaded existing config with ${Object.keys(config).length} entries`);

  const receipts: Receipt[] = [];
  // Preload all file contents
  const txs = files
    .sort()
    .flatMap(file => {
      logger.debug(`Processing file: ${file}`);
      const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Data;
      const pieces = file.split('/');
      const chainId = pieces[pieces.length - 2];
      const env = data.meta?.env;
      logger.debug(`File ${file} has chainId: ${chainId}, env: ${env || 'none'}`);

      if (!contractNames[chainId]) contractNames[chainId] = {};
      if (!implementationAddresses[chainId])
        implementationAddresses[chainId] = new Set();

      let syncMetaDeployments: () => void = () => {};
      if (env) {
        if (!config[env]) config[env] = {};
        if (!config[env][chainId]) config[env][chainId] = {};
        syncMetaDeployments = () => 
          Object.assign(config[env][chainId], data.meta?.deployments ?? {});
      } else {
        if (!config[chainId]) config[chainId] = {};
        syncMetaDeployments = () =>
          Object.assign(config[chainId], data.meta?.deployments ?? {});
      }
      if (!contractTimestamps[chainId]) contractTimestamps[chainId] = {};
      if (!implementationFor[chainId]) implementationFor[chainId] = {};

      receipts.push(...data.receipts);
      logger.debug(`Added ${data.receipts.length} receipts from ${file}`);

      return data.transactions.map(tx => ({tx, env, chainId, data, syncMetaDeployments}));
    })
    .sort((a, b) => a.data.timestamp - b.data.timestamp);

  logger.debug(`Processed ${txs.length} transactions from all files`);

  // First pass: save all contract names and implementation addresses
  logger.debug(`Starting first pass: collecting contract names and implementation addresses`);
  txs.forEach(({tx, chainId}) => {
    if (tx.contractName && tx.contractAddress) {
      contractNames[chainId][tx.contractAddress.toLowerCase()] =
        tx.contractName;
      if (tx.contractName.endsWith('Implementation')) {
        implementationAddresses[chainId].add(tx.contractAddress.toLowerCase());
        logger.debug(`Found implementation: ${tx.contractName} at ${tx.contractAddress} on chain ${chainId}`);
      }
    }
  });

  // Second pass: process upgrades and deployments
  logger.debug(`Starting second pass: processing upgrades`);
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
          const root = env
            ? (config[env][chainId] as Record<string, string>)
            : (config[chainId] as Record<string, string>);
          root[`${baseName}Implementation`] = getAddress(implementationAddress);
          implementationAddresses[chainId].add(implementationName);

          const proxyAddress = log.address.toLowerCase();
          implementationFor[chainId][proxyAddress] = baseName;
          logger.debug(`Processed upgrade: ${baseName} implementation at ${implementationAddress}, proxy at ${proxyAddress}`);
        }
      }
    });
  });

  logger.debug(`Starting third pass: processing deployments`);
  txs.forEach(({tx, chainId, data, env, syncMetaDeployments}) => {
    if (tx.contractName && tx.contractAddress && tx.hash) {
      contractTimestamps[chainId][tx.contractName] = data.timestamp;
      const contractAddress = tx.contractAddress.toLowerCase();

      const root: Record<string, string> = env
        ? (config[env][chainId] as Record<string, string>)
        : (config[chainId] as Record<string, string>);

      if (tx.transactionType === 'CREATE' || tx.transactionType === 'CREATE2') {
        if (tx.contractName === 'TransparentUpgradeableProxy') {
          const baseName = implementationFor[chainId][contractAddress];
          root[baseName] = getAddress(contractAddress);
          logger.debug(`Added proxy contract: ${baseName} at ${contractAddress} on chain ${chainId}`);
        } else if (!implementationAddresses[chainId].has(tx.contractName)) {
          root[tx.contractName] = getAddress(contractAddress);
          logger.debug(`Added contract: ${tx.contractName} at ${contractAddress} on chain ${chainId}`);
        }
      }
    }
    syncMetaDeployments();
  });

  // Remove empty objects before writing to file
  logger.debug(`Cleaning up empty objects in config`);
  Object.keys(config).forEach(key => {
    if (typeof config[key] === 'object') {
      Object.keys(config[key]).forEach(subKey => {
        if (Object.keys(config[key][subKey]).length === 0) {
          delete config[key][subKey];
          logger.debug(`Removed empty object at ${key}.${subKey}`);
        }
      });
      if (Object.keys(config[key]).length === 0) {
        delete config[key];
        logger.debug(`Removed empty object at ${key}`);
      }
    }
  });

  logger.debug(`Writing deployments to ${deploymentsPath}`);
  fs.writeFileSync(deploymentsPath, JSON.stringify(config, null, 2));
  logger.debug(`Successfully wrote deployments.json with ${Object.keys(config).length} top-level entries`);
}
