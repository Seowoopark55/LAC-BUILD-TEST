// Root entrypoint for the TEST Vercel project only. Install root dependencies first.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vite = resolve(root, 'node_modules/vite/bin/vite.js');
if (!existsSync(vite)) throw new Error('Root dependencies missing. Run npm install in the repository root.');
execFileSync(process.execPath, [resolve(root, 'scripts/verify.mjs')], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, [resolve(root, 'scripts/verify-deploy.mjs')], { cwd: root, stdio: 'inherit' });
for (const folder of ['hub', 'build']) {
  console.log(`Building ${folder}...`);
  execFileSync(process.execPath, [vite, 'build'], { cwd: resolve(root, folder), stdio: 'inherit', env: process.env });
}
const from = resolve(root, 'build/dist');
const to = resolve(root, 'hub/dist/build');
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true, force: true });
const html = readFileSync(resolve(to, 'index.html'), 'utf8');
if (!html.includes('/build/assets/')) throw new Error('BUILD assets are not under /build/assets/.');
if (!existsSync(resolve(root, 'hub/dist/index.html'))) throw new Error('HUB index.html missing.');
console.log('PASS: TEST build assembled at hub/dist (HUB / + BUILD /build/).');
