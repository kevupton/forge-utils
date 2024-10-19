import fs from 'fs';
import path from 'path';
import {removeBytecode} from './remove-bytecode';

jest.mock('fs');
jest.mock('path');

describe('removeBytecode', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove bytecode from TypeChain output files', () => {
    // Mock file system
    const mockFiles = [
      {
        name: 'Contract1.ts',
        isFile: () => true,
        isDirectory: () => false,
      },
      {
        name: 'Contract2.js',
        isFile: () => true,
        isDirectory: () => false,
      },
      {
        name: 'subdir',
        isFile: () => false,
        isDirectory: () => true,
      },
    ];

    mockFs.readdirSync.mockReturnValueOnce(mockFiles as any);
    mockFs.readdirSync.mockReturnValueOnce([]);

    const mockFileContent = `
      // Some code
      const _bytecode = "0x60806040...long bytecode...";
      // More code
    `;

    const expectedCleanContent = `
      // Some code
      const _bytecode = "0x";
      // More code
    `;

    mockFs.readFileSync.mockReturnValue(mockFileContent);
    mockFs.writeFileSync.mockImplementation(() => {});

    mockPath.join.mockImplementation((...paths) => paths.join('/'));

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Call the function
    removeBytecode('/mock/path');

    // Assertions
    expect(mockFs.readdirSync).toHaveBeenCalledWith('/mock/path', {
      withFileTypes: true,
    });
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.ts'),
      expectedCleanContent,
      'utf8'
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.js'),
      expectedCleanContent,
      'utf8'
    );
    expect(mockPath.join).toHaveBeenCalledWith('/mock/path', 'subdir');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Successfully cleaned file:')
    );

    consoleLogSpy.mockRestore();
  });

  it('should handle errors when reading directory', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockFs.readdirSync.mockImplementation(() => {
      throw new Error('Mock readdir error');
    });

    removeBytecode('/mock/path');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing directory: /mock/path',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle errors when reading files', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockFs.readdirSync.mockReturnValue([
      {name: 'Contract.ts', isFile: () => true, isDirectory: () => false},
    ] as any);

    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('Mock readFile error');
    });

    removeBytecode('/mock/path');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing file: /mock/path/Contract.ts',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle errors when writing files', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockFs.readdirSync.mockReturnValue([
      {name: 'Contract.ts', isFile: () => true, isDirectory: () => false},
    ] as any);

    mockFs.readFileSync.mockReturnValue('const _bytecode = "0x60806040...";');

    mockFs.writeFileSync.mockImplementation(() => {
      throw new Error('Mock writeFile error');
    });

    removeBytecode('/mock/path');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing file: /mock/path/Contract.ts',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
