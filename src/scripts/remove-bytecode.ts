import fs from 'fs';
import path from 'path';

export function removeBytecode(directoryPath: string): void {
  fs.readdir(directoryPath, {withFileTypes: true}, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${directoryPath}`, err);
      return;
    }

    files.forEach(file => {
      if (file.isFile()) {
        if (file.name.endsWith('.js') || file.name.endsWith('.ts')) {
          cleanFile(path.join(file.path, file.name));
        }
      } else if (
        file.isDirectory() &&
        file.name !== '.' &&
        file.name !== '..'
      ) {
        removeBytecode(path.join(file.path, file.name));
      }
    });
  });
}

function cleanFile(filePath: string): void {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file: ${filePath}`, err);
      return;
    }

    // Replace all string constants in double quotes
    const updatedContent = data.replace(
      /const _bytecode =[\s\S]+".*?";/g,
      'const _bytecode = "0x";'
    );

    fs.writeFile(filePath, updatedContent, 'utf8', err => {
      if (err) {
        console.error(`Error writing file: ${filePath}`, err);
        return;
      }
      console.log(`File updated: ${filePath}`);
    });
  });
}
