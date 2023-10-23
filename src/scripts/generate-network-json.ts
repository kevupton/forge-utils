import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

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
  dir: string;
}

const contractTimestamps: Record<string, [number, number]> = {};

export function generateNetworkJson({output, dir}: Options) {
  // Modify this path
  const inputDir = path.join(dir, 'broadcast', '**/*.json');

  const files = glob.sync(inputDir).filter(file => file.endsWith('.json'));

  const network: NetworkConfig = {};
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const data: Data = JSON.parse(content);

    const pieces = file.split('/');
    const networkId = pieces[pieces.length - 2];
    network[networkId] = network[networkId] || {};

    const receipt = (hash: string): Receipt | undefined =>
      data.receipts.find(receipt => receipt.transactionHash === hash);

    data.transactions.forEach(tx => {
      if (tx.contractName && tx.contractAddress) {
        const r = receipt(tx.hash);
        const currentBlockNumber =
          +BigInt(r?.blockNumber || '0').toString() ||
          contractTimestamps[tx.contractName][1] ||
          0;

        if (contractTimestamps[tx.contractName][0] < data.timestamp) {
          contractTimestamps[tx.contractName] = [
            data.timestamp,
            currentBlockNumber,
          ];

          network[networkId][tx.contractName] = {
            address: tx.contractAddress,
            startBlock: currentBlockNumber,
          };
        }
      }
    });
  });

  fs.writeFileSync(
    path.join(output, 'network.json'),
    JSON.stringify(network, null, 2)
  );
}
