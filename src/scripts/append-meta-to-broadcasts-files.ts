import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
import {sync} from 'glob';
import _ from 'lodash';
import {FORGE_UTILS_DIR, META_FILENAME} from '../utils/constants';
import { parseValue } from '../utils';

interface MetaArgs {
  [key: string]: any;
}

interface AppendMetaOptions {
  dir: string;
  meta: MetaArgs;
  newFilesOnly?: boolean;
  cwd?: string;
}

export const appendMetaToBroadcastFiles = (
  options: AppendMetaOptions
) => {
  const {dir, meta, newFilesOnly = false, cwd = process.cwd()} = options;

  const files = sync(path.join(dir, '**/*.json')).filter(
    file => !file.endsWith('run-latest.json')
  );
  const filesToProcess = newFilesOnly ? getNewFiles(files) : files;
  
  // Load meta from .forge-utils/meta.json if it exists
  const metaFromFile = loadMetaFromFile(cwd);
  
  // Combine meta from command line and meta file
  const combinedMeta = processMeta(meta, metaFromFile);
  
  processFiles(filesToProcess, combinedMeta);

  // Remove meta file after successfully processing
  removeMetaFile(cwd);
};

/**
 * Loads meta from .forge-utils/meta.json if it exists
 */
function loadMetaFromFile(cwd: string): Record<string, any> {
  const metaPath = path.join(cwd, FORGE_UTILS_DIR, META_FILENAME);

  if (fs.existsSync(metaPath)) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (e) {
      console.warn(`Failed to parse ${metaPath}, ignoring file`);
    }
  }
  return {};
}

/**
 * Process meta arguments from command line and combine with meta from file
 */
function processMeta(metaArgs: MetaArgs, metaFromFile: Record<string, any>): MetaArgs {
  const result: MetaArgs = {
    ...metaFromFile,
  };
  
  // Process meta arguments from command line (format: key=value)
  for (const [key, value] of Object.entries(metaArgs)) {
    _.set(result, key, parseValue(value));
  }
  
  return result;
}

/**
 * Removes the meta file after successful processing
 */
function removeMetaFile(cwd: string): void {
  const metaPath = path.join(cwd, FORGE_UTILS_DIR, META_FILENAME);
  
  if (fs.existsSync(metaPath)) {
    try {
      fs.unlinkSync(metaPath);
      console.log(`Successfully removed ${metaPath}`);
    } catch (e) {
      console.warn(`Failed to remove ${metaPath}: ${e}`);
    }
  }
}

function appendMetaToFile(filePath: string, meta: MetaArgs) {
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);

  if (!json.meta) {
    json.meta = {};
  }

  Object.assign(json.meta, meta);

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
}

function getNewFiles(files: string[]): string[] {
  let gitLsFiles: string;
  try {
    gitLsFiles = execSync(`git ls-files --error-unmatch ${files.join(' ')}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error: any) {
    gitLsFiles = error.stdout;
  }

  const trackedFiles = new Set(gitLsFiles.trim().split('\n'));
  return files.filter(file => {
    return (
      !trackedFiles.has(file) &&
      !Array.from(trackedFiles).some(trackedFile => file.endsWith(trackedFile))
    );
  });
}

function processFiles(files: string[], meta: MetaArgs) {
  for (const file of files) {
    appendMetaToFile(file, meta);
  }
}
