import fs from 'fs';
import path from 'path';
import {generateNetworksJson} from '../generate-networks-json';

jest.mock('fs');
jest.mock('glob');
jest.mock('path');

describe('generateNetworksJson', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockGlob = require('glob') as jest.Mocked<typeof import('glob')>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  it('should generate networks JSON file correctly', () => {
    // Mock the glob sync function to return test files
    mockGlob.sync.mockReturnValue([
      '/path/to/package/broadcasts/1/run-latest.json',
      '/path/to/package/broadcasts/5/run-latest.json',
    ]);

    // Mock file system operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({isDirectory: () => true} as fs.Stats);
    mockFs.readFileSync.mockImplementation(path => {
      if (path === '/path/to/package/broadcasts/1/run-latest.json') {
        return JSON.stringify({
          transactions: [
            {
              contractName: 'TestContract',
              contractAddress: '0x1234567890123456789012345678901234567890',
              hash: '0xabcdef',
            },
          ],
          receipts: [
            {
              transactionHash: '0xabcdef',
              blockNumber: '123',
            },
          ],
          timestamp: 1625097600,
          meta: {env: 'default'},
        });
      } else if (path === '/path/to/package/broadcasts/5/run-latest.json') {
        return JSON.stringify({
          transactions: [
            {
              contractName: 'AnotherContract',
              contractAddress: '0x0987654321098765432109876543210987654321',
              hash: '0xfedcba',
            },
          ],
          receipts: [
            {
              transactionHash: '0xfedcba',
              blockNumber: '456',
            },
          ],
          timestamp: 1625184000,
          meta: {env: 'default'},
        });
      }
      throw new Error(`Unexpected file path: ${path}`);
    });

    const options = {
      output: '/path/to/output',
      package: '@package/name',
      dir: 'broadcasts',
    };

    generateNetworksJson(options);

    // Check if the output file was written correctly
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/output/networks.json',
      expect.any(String)
    );

    // Parse the written JSON and check its content
    const writtenContent = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenContent).toEqual({
      mainnet: {
        TestContract: {
          address: '0x1234567890123456789012345678901234567890',
          startBlock: 123,
        },
      },
      goerli: {
        AnotherContract: {
          address: '0x0987654321098765432109876543210987654321',
          startBlock: 456,
        },
      },
    });
  });

  it('should handle TransparentUpgradeableProxy correctly', () => {
    mockGlob.sync.mockReturnValue([
      '/path/to/package/broadcasts/1/run-latest.json',
    ]);

    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({isDirectory: () => true} as fs.Stats);
    mockFs.readFileSync.mockImplementation(() => {
      return JSON.stringify({
        transactions: [
          {
            contractName: 'TestImplementation',
            contractAddress: '0x1111111111111111111111111111111111111111',
            hash: '0xaaaa',
          },
          {
            contractName: 'TransparentUpgradeableProxy',
            contractAddress: '0x2222222222222222222222222222222222222222',
            hash: '0xbbbb',
          },
          {
            transactionType: 'CALL',
            function: 'upgradeAndCall(address,address,bytes)',
            arguments: [
              '0x2222222222222222222222222222222222222222',
              '0x1111111111111111111111111111111111111111',
              '0x',
            ],
            hash: '0xcccc',
          },
        ],
        receipts: [
          {transactionHash: '0xaaaa', blockNumber: '100'},
          {transactionHash: '0xbbbb', blockNumber: '101'},
          {transactionHash: '0xcccc', blockNumber: '102'},
        ],
        timestamp: 1625270400,
        meta: {env: 'default'},
      });
    });

    const options = {
      output: '/path/to/output',
      package: '@package/name',
      dir: 'broadcasts',
    };

    generateNetworksJson(options);

    const writtenContent = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenContent).toEqual({
      mainnet: {
        Test: {
          address: '0x2222222222222222222222222222222222222222',
          startBlock: 101,
        },
        TestImplementation: {
          address: '0x1111111111111111111111111111111111111111',
          startBlock: 101,
        },
      },
    });
  });

  it('should handle different environments correctly', () => {
    mockGlob.sync.mockReturnValue([
      '/path/to/package/broadcasts/1/run-latest.json',
      '/path/to/package/broadcasts/5/run-latest.json',
    ]);

    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({isDirectory: () => true} as fs.Stats);
    mockFs.readFileSync.mockImplementation(path => {
      if (path === '/path/to/package/broadcasts/1/run-latest.json') {
        return JSON.stringify({
          transactions: [
            {
              contractName: 'ProductionContract',
              contractAddress: '0x1111111111111111111111111111111111111111',
              hash: '0xaaaa',
            },
          ],
          receipts: [{transactionHash: '0xaaaa', blockNumber: '100'}],
          timestamp: 1625097600,
          meta: {env: 'production'},
        });
      } else if (path === '/path/to/package/broadcasts/5/run-latest.json') {
        return JSON.stringify({
          transactions: [
            {
              contractName: 'StagingContract',
              contractAddress: '0x2222222222222222222222222222222222222222',
              hash: '0xbbbb',
            },
          ],
          receipts: [{transactionHash: '0xbbbb', blockNumber: '200'}],
          timestamp: 1625184000,
          meta: {env: 'staging'},
        });
      }
      throw new Error(`Unexpected file path: ${path}`);
    });

    const options = {
      output: '/path/to/output',
      package: '@package/name',
      dir: 'broadcasts',
      env: 'production',
    };

    generateNetworksJson(options);

    const writtenContent = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenContent).toEqual({
      mainnet: {
        ProductionContract: {
          address: '0x1111111111111111111111111111111111111111',
          startBlock: 100,
        },
      },
    });
  });
});
