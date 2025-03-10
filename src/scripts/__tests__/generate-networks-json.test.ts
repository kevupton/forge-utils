import fs from 'fs';
import path from 'path';
import {generateNetworksJson} from '../generate-networks-json';

jest.mock('fs');
jest.mock('glob');
jest.mock('path');
jest.mock('../../utils/logger');

// Import the mocked logger
import {logger} from '../../utils/logger';

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
              transactionType: 'CREATE',
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
              transactionType: 'CREATE',
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
      } else if (path === '/path/to/output/networks.json') {
        return JSON.stringify({});
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
    mockFs.readFileSync.mockImplementation(path => {
      if (path === '/path/to/output/networks.json') {
        return JSON.stringify({});
      }
      return JSON.stringify({
        transactions: [
          {
            transactionType: 'CREATE',
            contractName: 'TestImplementation',
            contractAddress: '0x1111111111111111111111111111111111111111',
            hash: '0xaaaa',
          },
          {
            transactionType: 'CREATE2',
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
          {
            transactionHash: '0xbbbb',
            blockNumber: '101',
            logs: [
              {
                topics: [
                  '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
                  '0x0000000000000000000000001111111111111111111111111111111111111111',
                ],
                address: '0x2222222222222222222222222222222222222222',
                data: '0x',
              },
            ],
          },
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
          startBlock: 100,
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
              transactionType: 'CREATE',
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
              transactionType: 'CREATE',
              contractName: 'StagingContract',
              contractAddress: '0x2222222222222222222222222222222222222222',
              hash: '0xbbbb',
            },
          ],
          receipts: [{transactionHash: '0xbbbb', blockNumber: '200'}],
          timestamp: 1625184000,
          meta: {env: 'staging'},
        });
      } else if (path === '/path/to/output/networks.json') {
        return JSON.stringify({});
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

  it('should handle custom deployments from meta.deployments correctly', () => {
    // Mock the glob sync function to return test files
    mockGlob.sync.mockReturnValue([
      '/path/to/package/broadcasts/1/run-latest.json',
    ]);

    // Mock file system operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({isDirectory: () => true} as fs.Stats);
    mockFs.readFileSync.mockImplementation(path => {
      if (path === '/path/to/package/broadcasts/1/run-latest.json') {
        return JSON.stringify({
          transactions: [
            {
              transactionType: 'CREATE',
              contractName: 'TestImplementation',
              contractAddress: '0x1111111111111111111111111111111111111111',
              hash: '0xabcdef',
            },
            {
              transactionType: 'CREATE',
              contractName: 'Test',
              contractAddress: '0x2222222222222222222222222222222222222222',
              hash: '0xabcdef2',
            },
            {
              transactionType: 'CREATE',
              contractName: 'TransparentUpgradeableProxy',
              contractAddress: '0x1234567890123456789012345678901234567890',
              hash: '0xabcdef3',
              additionalContracts: [
                {
                  address: '0x3333333333333333333333333333333333333333',
                },
              ],
            },
          ],
          receipts: [
            {
              transactionHash: '0xabcdef',
              blockNumber: '123',
            },
            {
              transactionHash: '0xabcdef2',
              blockNumber: '124',
            },
            {
              transactionHash: '0xabcdef3',
              blockNumber: '100',
            },
          ],
          timestamp: 1625097600,
          meta: {
            env: 'default',
            deployments: {
              CustomContract1: '0x3333333333333333333333333333333333333333',
              CustomContract2: '0x4444444444444444444444444444444444444444',
            },
          },
        });
      }
      return '{}';
    });

    // Mock writeFileSync to capture the written content
    let writtenContent: any;
    mockFs.writeFileSync.mockImplementation((_, content) => {
      writtenContent = JSON.parse(content as string);
    });

    // Run the function
    generateNetworksJson({
      output: '/path/to/output',
      package: '@package/name',
      dir: 'broadcasts',
    });

    // Verify that the output file was written with the correct content
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/output/networks.json',
      expect.any(String)
    );

    // Verify that CustomContract1 was added correctly (found in additionalContracts)
    expect(writtenContent.mainnet.CustomContract1).toEqual({
      address: '0x3333333333333333333333333333333333333333',
      startBlock: 100,
    });

    // Verify that an error was logged for CustomContract2 (not found in any transaction)
    expect(logger.error).toHaveBeenCalledWith(
      'no transaction found CustomContract2 0x4444444444444444444444444444444444444444'
    );
  });
});
