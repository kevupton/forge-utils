import fs from 'fs';
import path from 'path';

export function removeBytecode(directoryPath: string): void {
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
        removeBytecode(filePath);
      }
    }
  } catch (err) {
    console.error(`Error processing directory: ${directoryPath}`, err);
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

    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Successfully cleaned file: ${filePath}`);
  } catch (err) {
    console.error(`Error processing file: ${filePath}`, err);
  }
}
