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

type DeploymentConfig = Record<string, Record<string, string>>;

interface Options {
  output: string;
  dir: string;
}

const contractTimestamps: Record<string, Record<string, number>> = {};

export function generateDeploymentsJson({output, dir}: Options) {
  // Modify this path
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
    config[chainId] = config[chainId] || {};
    contractTimestamps[chainId] = contractTimestamps[chainId] || {};

    data.transactions.forEach(tx => {
      if (tx.contractName && tx.contractAddress && tx.hash) {
        const prevTimestamp = contractTimestamps[chainId][tx.contractName] || 0;

        if (prevTimestamp < data.timestamp) {
          contractTimestamps[chainId][tx.contractName] = data.timestamp;

          config[chainId][tx.contractName] = tx.contractAddress;
        }
      }
    });
  });

  fs.writeFileSync(deploymentsPath, JSON.stringify(config, null, 2));
}
