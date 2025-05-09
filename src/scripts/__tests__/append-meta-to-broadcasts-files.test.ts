import fs from 'fs';
import path from 'path';
import os from 'os';
import {appendMetaToBroadcastFiles} from '../append-meta-to-broadcasts-files';

describe('append-meta command', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for our test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'append-meta-test-'));
  });

  afterEach(() => {
    // Clean up the temporary directory after each test
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('should append meta information to broadcast files', () => {
    // Create a mock broadcast file
    const broadcastContent = JSON.stringify({
      transactions: [],
      receipts: [],
      libraries: [],
    });
    fs.writeFileSync(
      path.join(tempDir, 'broadcast_file.json'),
      broadcastContent
    );

    // Run the append-meta function
    appendMetaToBroadcastFiles({
      dir: tempDir,
      meta: {env: 'staging', version: '1.0.0'},
    });

    // Read the updated file
    const updatedContent = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'broadcast_file.json'), 'utf8')
    );

    // Check if meta information was appended correctly
    expect(updatedContent.meta).toBeDefined();
    expect(updatedContent.meta.env).toBe('staging');
    expect(updatedContent.meta.version).toBe('1.0.0');
  });

  it('should not modify non-broadcast files', () => {
    // Create a non-broadcast JSON file
    const nonBroadcastContent = JSON.stringify({some: 'data'});
    fs.writeFileSync(
      path.join(tempDir, 'unsupported_name_file.text'),
      nonBroadcastContent
    );

    // Run the append-meta function
    appendMetaToBroadcastFiles({
      dir: tempDir,
      meta: {'meta.env': 'staging'},
      cwd: tempDir,
    });

    // Read the file
    const updatedContent = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'unsupported_name_file.text'), 'utf8')
    );

    // Check that the file was not modified
    expect(updatedContent).toEqual({some: 'data'});
  });

  it('should append meta information to nested broadcast files', () => {
    // Create a nested directory structure
    const nestedDir = path.join(tempDir, 'nested', 'dir');
    fs.mkdirSync(nestedDir, {recursive: true});

    // Create a mock broadcast file in the nested directory
    const broadcastContent = JSON.stringify({
      transactions: [],
      receipts: [],
      libraries: [],
    });
    fs.writeFileSync(
      path.join(nestedDir, 'nested_broadcast_file.json'),
      broadcastContent
    );

    // Run the append-meta function
    appendMetaToBroadcastFiles({
      dir: tempDir,
      meta: {env: 'production'},
    });

    // Read the updated file
    const updatedContent = JSON.parse(
      fs.readFileSync(
        path.join(nestedDir, 'nested_broadcast_file.json'),
        'utf8'
      )
    );

    // Check if meta information was appended correctly
    expect(updatedContent.meta).toBeDefined();
    expect(updatedContent.meta.env).toBe('production');
  });

  it('should update existing meta information', () => {
    // Create a mock broadcast file with existing meta
    const broadcastContent = JSON.stringify({
      transactions: [],
      receipts: [],
      libraries: [],
      meta: {
        existing: 'data',
        env: 'development',
      },
    });
    fs.writeFileSync(
      path.join(tempDir, 'existing_broadcast_meta_file.json'),
      broadcastContent
    );

    // Run the append-meta function
    appendMetaToBroadcastFiles({
      dir: tempDir,
      meta: {env: 'staging', new: 'value'},
    });

    // Read the updated file
    const updatedContent = JSON.parse(
      fs.readFileSync(
        path.join(tempDir, 'existing_broadcast_meta_file.json'),
        'utf8'
      )
    );

    // Check if meta information was updated correctly
    expect(updatedContent.meta).toBeDefined();
    expect(updatedContent.meta.existing).toBe('data');
    expect(updatedContent.meta.env).toBe('staging');
    expect(updatedContent.meta.new).toBe('value');
  });

  it('should append meta information from meta.json file', () => {
    // Create a mock .forge-utils directory
    const forgeUtilsDir = path.join(tempDir, '.forge-utils');
    fs.mkdirSync(forgeUtilsDir, {recursive: true});

    // Create a mock meta.json file
    const metaContent = JSON.stringify({
      network: 'mainnet',
      version: '1.0.0',
      deployedBy: 'test-user',
    });
    fs.writeFileSync(path.join(forgeUtilsDir, 'meta.json'), metaContent);

    // Create a mock broadcast file
    const broadcastContent = JSON.stringify({
      transactions: [],
      receipts: [],
      libraries: [],
    });
    fs.writeFileSync(
      path.join(tempDir, 'broadcast_file_for_meta_json.json'),
      broadcastContent
    );

    // Run the append-meta function without explicit meta params
    appendMetaToBroadcastFiles({
      dir: tempDir,
      meta: {},
      cwd: tempDir,
    });

    // Read the updated file
    const updatedContent = JSON.parse(
      fs.readFileSync(
        path.join(tempDir, 'broadcast_file_for_meta_json.json'),
        'utf8'
      )
    );

    // Check if meta information from meta.json was appended correctly
    expect(updatedContent.meta).toBeDefined();
    expect(updatedContent.meta.network).toBe('mainnet');
    expect(updatedContent.meta.version).toBe('1.0.0');
    expect(updatedContent.meta.deployedBy).toBe('test-user');
  });

  it('should merge meta information from meta.json with provided meta params', () => {
    // Create a mock .forge-utils directory
    const forgeUtilsDir = path.join(tempDir, '.forge-utils');
    fs.mkdirSync(forgeUtilsDir, {recursive: true});

    // Create a mock meta.json file
    const metaContent = JSON.stringify({
      network: 'testnet',
      version: '1.0.0',
      deployedBy: 'test-user',
    });
    fs.writeFileSync(path.join(forgeUtilsDir, 'meta.json'), metaContent);

    // Create a mock broadcast file
    const broadcastContent = JSON.stringify({
      transactions: [],
      receipts: [],
      libraries: [],
    });
    fs.writeFileSync(
      path.join(tempDir, 'broadcast_file_for_merged_meta.json'),
      broadcastContent
    );

    // Run the append-meta function with explicit meta params
    appendMetaToBroadcastFiles({
      dir: tempDir,
      meta: {env: 'staging', version: '2.0.0'},
      cwd: tempDir,
    });

    // Read the updated file
    const updatedContent = JSON.parse(
      fs.readFileSync(
        path.join(tempDir, 'broadcast_file_for_merged_meta.json'),
        'utf8'
      )
    );

    // Check if meta information was merged correctly
    expect(updatedContent.meta).toBeDefined();
    expect(updatedContent.meta.network).toBe('testnet');
    expect(updatedContent.meta.version).toBe('2.0.0'); // Explicit param overrides meta.json
    expect(updatedContent.meta.deployedBy).toBe('test-user');
    expect(updatedContent.meta.env).toBe('staging');
  });
});
