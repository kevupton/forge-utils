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

export function generateDeploymentsJson({output, dir}: Options) {
  const inputDir = path.join(dir, 'broadcast', '**/*.json');

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
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const data: Data = JSON.parse(content);

    const pieces = file.split('/');
    const chainId = pieces[pieces.length - 2];
    const env = data.meta?.env || 'default';

    config[env] = config[env] || {};
    config[env][chainId] = config[env][chainId] || {};
    contractTimestamps[chainId] = contractTimestamps[chainId] || {};
    contractNames[chainId] = contractNames[chainId] || {};

    // If there's no existing contractNames for this chainId, initialize it from the loaded config
    if (Object.keys(contractNames[chainId]).length === 0) {
      Object.entries(config[env][chainId]).forEach(([key, value]) => {
        const address = config[env][chainId][key];
        if (address) {
          contractNames[chainId][address.toLowerCase()] = value;
        }
      });
    }

    // First pass: save all implementation names by their contract address
    data.transactions.forEach(tx => {
      if (tx.contractName && tx.contractAddress) {
        contractNames[chainId][tx.contractAddress.toLowerCase()] =
          tx.contractName;
      }
    });

    data.transactions.forEach(tx => {
      if (tx.contractName && tx.contractAddress && tx.hash) {
        const prevTimestamp = contractTimestamps[chainId][tx.contractName] || 0;

        if (prevTimestamp < data.timestamp) {
          contractTimestamps[chainId][tx.contractName] = data.timestamp;

          if (tx.contractName === 'TransparentUpgradeableProxy') {
            // Find the implementation contract based on the upgradeAndCall transaction
            const upgradeAndCallTx = data.transactions.find(
              t =>
                t.transactionType === 'CALL' &&
                t.function === 'upgradeAndCall(address,address,bytes)' &&
                t.arguments &&
                t.arguments.length > 2 &&
                t.arguments[0] === tx.contractAddress
            );
            if (upgradeAndCallTx && upgradeAndCallTx.arguments) {
              const proxyAddress = upgradeAndCallTx.arguments[0];
              const implementationAddress = upgradeAndCallTx.arguments[1];
              const implementationName =
                contractNames[chainId][implementationAddress.toLowerCase()];
              if (implementationName) {
                const baseName = implementationName.replace(
                  'Implementation',
                  ''
                );
                config[env][chainId][baseName] = proxyAddress;
                config[env][chainId][`${baseName}Implementation`] =
                  implementationAddress;
              }
            }
          } else {
            config[env][chainId][tx.contractName] = tx.contractAddress;
          }
        }
      }
    });
  });

  fs.writeFileSync(deploymentsPath, JSON.stringify(config, null, 2));
}
