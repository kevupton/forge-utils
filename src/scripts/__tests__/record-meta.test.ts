import fs from 'fs';
import path from 'path';
import {recordMeta} from '../record-meta';

// Mock fs functions
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
}));

// Mock console functions
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('recordMeta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{}');
  });

  it('should record simple metadata', () => {
    // Call the function
    recordMeta({
      key: 'env',
      value: 'production',
      output: '.forge-utils',
    });

    // Check if file was written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('meta.json'),
      expect.stringContaining('"env": "production"'),
    );
  });

  it('should support dot notation for nested objects', () => {
    // Mock existing meta
    (fs.readFileSync as jest.Mock).mockReturnValue('{}');

    // Call the function with dot notation
    recordMeta({
      key: 'config.timeout',
      value: '30',
      output: '.forge-utils',
    });

    // Check if file was written with nested structure
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"config": {'),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"timeout": 30'),
    );
  });

  it('should support array notation', () => {
    // Mock existing meta with an array
    (fs.readFileSync as jest.Mock).mockReturnValue('{"networks":[]}');

    // Call the function with array notation
    recordMeta({
      key: 'networks[0]',
      value: 'mainnet',
      output: '.forge-utils',
    });

    // Check if file was written with array
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"networks": ['),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"mainnet"'),
    );
  });

  it('should parse JSON values', () => {
    // Call the function with a JSON object
    recordMeta({
      key: 'contracts',
      value: '{"Token":"0x1234","Vault":"0xabcd"}',
      output: '.forge-utils',
    });

    // Check if file was written with parsed JSON
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"Token": "0x1234"'),
    );
  });

  it('should handle numeric values', () => {
    // Call the function with a number
    recordMeta({
      key: 'gasLimit',
      value: '8000000',
      output: '.forge-utils',
    });

    // Check if file was written with number (not string)
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"gasLimit": 8000000'),
    );
  });

  it('should handle boolean values', () => {
    // Call the function with a boolean
    recordMeta({
      key: 'enabled',
      value: 'true',
      output: '.forge-utils',
    });

    // Check if file was written with boolean (not string)
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"enabled": true'),
    );
  });

  it('should merge with existing metadata', () => {
    // Mock existing meta
    (fs.readFileSync as jest.Mock).mockReturnValue('{"env":"staging"}');

    // Call the function
    recordMeta({
      key: 'network',
      value: 'mainnet',
      output: '.forge-utils',
    });

    // Check if file was written with both values
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"env": "staging"'),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"network": "mainnet"'),
    );
  });
}); 
