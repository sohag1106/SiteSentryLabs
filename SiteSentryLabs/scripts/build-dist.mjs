/**
 * Builds ./dist for Cloudflare Pages: static site + admin panel only.
 * Excludes server/, functions/, node_modules/, env files.
 */
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const dist = join(root, 'dist');

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const entries = [
  'index.html', 'about.html', 'services.html', 'team.html', 'contact.html',
  'css', 'js', 'data', 'assets', 'favicon', 'admin'
];

for (const entry of entries) {
  cpSync(join(root, entry), join(dist, entry), { recursive: true });
}

console.log(`dist/ built (${entries.length} top-level entries)`);
