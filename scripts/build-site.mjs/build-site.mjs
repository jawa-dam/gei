import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');

fs.mkdirSync(distDir, { recursive: true });

for (const file of fs.readdirSync(srcDir)) {
  const source = path.join(srcDir, file);
  const target = path.join(distDir, file);
  fs.copyFileSync(source, target);
}

console.log(`Built site to ${distDir}`);