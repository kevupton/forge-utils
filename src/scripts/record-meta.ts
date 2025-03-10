import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import {FORGE_UTILS_DIR, META_FILENAME, parseValue} from '../utils';

interface Options {
  key: string;
  value: string;
  output: string;
}

/**
 * Records metadata that can be used by the append-meta command
 * Supports dot notation for nested objects and arrays
 * @param options Command options
 */
export function recordMeta({key, value, output}: Options): void {
  try {
    // Use the default FORGE_UTILS_DIR if output is not specified
    const outputDir = path.resolve(process.cwd(), output || FORGE_UTILS_DIR);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {recursive: true});
    }

    const metaPath = path.join(outputDir, META_FILENAME);

    // Load existing meta if available
    let meta: Record<string, any> = {};
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (e) {
        console.warn('Failed to parse existing meta.json, creating new file');
      }
    }

    // Parse the value to handle numbers, booleans, and null
    const parsedValue = parseValue(value);

    // Update meta with new data using lodash's set method for dot notation
    _.set(meta, key, parsedValue);

    // Write updated meta to file
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    console.log(`Metadata recorded to ${metaPath}`);
    console.log(`Recorded entry: ${key} -> ${JSON.stringify(parsedValue)}`);
  } catch (error) {
    console.error('Error recording metadata:', error);
    throw new Error(`Failed to record metadata: ${error}`);
  }
}
