import fs from 'fs';
import {generateDeploymentsJson} from './generate-deployments-json';

jest.mock('fs');
jest.mock('glob');

describe('generateDeploymentsJson', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockGlob = require('glob') as jest.Mocked<typeof import('glob')>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate deployments JSON file correctly', () => {
    // Mock the glob sync function to return test files
    mockGlob.sync.mockReturnValue([
      '/path/to/broadcast/1/run-latest.json',
      '/path/to/broadcast/5/run-latest.json',
    ]);

    // Mock file system operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({isDirectory: () => true} as fs.Stats);
    mockFs.readFileSync.mockImplementation(path => {
      if (path === '/path/to/broadcast/1/run-latest.json') {
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
          meta: {env: 'production'},
        });
      } else if (path === '/path/to/broadcast/5/run-latest.json') {
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
          meta: {env: 'staging'},
        });
      }
      throw new Error(`Unexpected file path: ${path}`);
    });

    const options = {
      output: '/path/to/output',
      dir: '/path/to',
    };

    generateDeploymentsJson(options);

    // Check if the output file was written correctly
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      '/path/to/output/deployments.json',
      expect.any(String)
    );

    // Parse the written JSON and check its content
    const writtenContent = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenContent).toEqual({
      production: {
        '1': {
          TestContract: '0x1234567890123456789012345678901234567890',
        },
      },
      staging: {
        '5': {
          AnotherContract: '0x0987654321098765432109876543210987654321',
        },
      },
    });
  });

  it('should handle TransparentUpgradeableProxy correctly', () => {
    mockGlob.sync.mockReturnValue(['/path/to/broadcast/1/run-latest.json']);

    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({isDirectory: () => true} as fs.Stats);
    mockFs.readFileSync.mockImplementation(path => {
      if (path === '/path/to/broadcast/1/run-latest.json') {
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
          receipts: [],
          timestamp: 1625270400,
          meta: {env: 'default'},
        });
      }
      throw new Error(`Unexpected file read: ${path}`);
    });

    const options = {
      output: '/path/to/output',
      dir: '/path/to',
    };

    generateDeploymentsJson(options);

    const writtenContent = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenContent).toEqual({
      default: {
        '1': {
          Test: '0x2222222222222222222222222222222222222222',
          TestImplementation: '0x1111111111111111111111111111111111111111',
        },
      },
    });
  });

  it('should handle existing deployments.json file', () => {
    mockGlob.sync.mockReturnValue(['/path/to/broadcast/1/run-latest.json']);

    mockFs.existsSync.mockReturnValue(true);
    mockFs.statSync.mockReturnValue({isDirectory: () => true} as fs.Stats);
    mockFs.readFileSync
      .mockReturnValueOnce(
        JSON.stringify({
          existing: {
            '1': {
              ExistingContract: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            },
          },
        })
      )
      .mockReturnValueOnce(
        JSON.stringify({
          transactions: [
            {
              contractName: 'NewContract',
              contractAddress: '0xnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn',
              hash: '0xdddd',
            },
          ],
          receipts: [],
          timestamp: 1625356800,
          meta: {env: 'existing'},
        })
      );

    const options = {
      output: '/path/to/output',
      dir: '/path/to',
    };

    generateDeploymentsJson(options);

    const writtenContent = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenContent).toEqual({
      existing: {
        '1': {
          ExistingContract: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          NewContract: '0xnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn',
        },
      },
    });
  });
});
