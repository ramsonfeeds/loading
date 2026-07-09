import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  ['backend/.env.example', 'backend/.env'],
  ['frontend/.env.example', 'frontend/.env']
];

for (const [source, target] of files) {
  const sourcePath = resolve(root, source);
  const targetPath = resolve(root, target);

  if (existsSync(targetPath)) {
    console.log(`exists ${target}`);
    continue;
  }

  copyFileSync(sourcePath, targetPath);
  console.log(`created ${target}`);
}
