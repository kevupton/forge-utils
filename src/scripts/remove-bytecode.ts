import fs from 'fs';
import path from 'path';
import {logger} from '../lib';

let totalBytesRemoved = 0;

export function removeBytecode(
  directoryPath: string,
  isRecursive = false
): void {
  try {
    const files = fs.readdirSync(directoryPath, {withFileTypes: true});

    for (const file of files) {
      const filePath = path.join(directoryPath, file.name);

      if (
        file.isFile() &&
        (file.name.endsWith('.js') || file.name.endsWith('.ts'))
      ) {
        cleanFile(filePath);
      } else if (
        file.isDirectory() &&
        file.name !== '.' &&
        file.name !== '..'
      ) {
        removeBytecode(filePath, true);
      }
    }

    if (!isRecursive) {
      logger.info(
        `Total megabytes removed: ${(totalBytesRemoved / (1024 * 1024)).toFixed(
          2
        )} MB`
      );
    }
  } catch (err) {
    logger.error(`Error processing directory: ${directoryPath}`, err);
  }
}

function cleanFile(filePath: string): void {
  try {
    const data = fs.readFileSync(filePath, 'utf8');

    // Replace all string constants in double quotes
    const updatedContent = data.replace(
      /const _bytecode =[\s\S]+".*?";/g,
      'const _bytecode = "0x";'
    );

    const bytesRemoved =
      Buffer.byteLength(data) - Buffer.byteLength(updatedContent);
    totalBytesRemoved += bytesRemoved;

    fs.writeFileSync(filePath, updatedContent, 'utf8');
  } catch (err) {
    logger.error(`Error processing file: ${filePath}`, err);
  }
}
