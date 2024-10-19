import fs from 'fs';
import path from 'path';

export const appendMetaToBroadcastFiles = (dir: string, meta: any) => {
  processDirectory(dir, meta);
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

function processDirectory(dir: string, meta: MetaArgs) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath, meta);
    } else if (file.endsWith('.json') ) {
      appendMetaToFile(filePath, meta);
    }
  }
}
