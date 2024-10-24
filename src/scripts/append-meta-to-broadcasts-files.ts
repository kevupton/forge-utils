import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';
import {sync} from 'glob';

export const appendMetaToBroadcastFiles = (
  dir: string,
  meta: any,
  newFilesOnly = false
) => {
  const files = sync(path.join(dir, '**/*.json')).filter(
    file => !file.endsWith('run-latest.json')
  );
  const filesToProcess = newFilesOnly ? getNewFiles(files) : files;
  processFiles(filesToProcess, meta);
};

interface MetaArgs {
  [key: string]: string;
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
