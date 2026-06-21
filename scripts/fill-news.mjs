/**
 * Fill the site with maximum stories via fast-publish pipeline.
 * Usage: npm run fill:news
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq <= 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnv();

const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL || '').replace(/\/$/, '');
const SECRET = process.env.WORKER_API_SECRET || '';

if (!WORKER_URL || !SECRET) {
  const secretsPath = join(ROOT, 'workers/secrets.env');
  if (existsSync(secretsPath)) {
    for (const line of readFileSync(secretsPath, 'utf8').split('\n')) {
      const t = line.trim();
      if (t.startsWith('WORKER_API_SECRET=') && !SECRET) {
        process.env.WORKER_API_SECRET = t.slice('WORKER_API_SECRET='.length).trim();
      }
    }
  }
}

const url = (process.env.NEXT_PUBLIC_WORKER_URL || '').replace(/\/$/, '');
const token = process.env.WORKER_API_SECRET || '';

if (!url || !token) {
  console.error('Set NEXT_PUBLIC_WORKER_URL and WORKER_API_SECRET in .env.local or workers/secrets.env');
  process.exit(1);
}

const rounds = parseInt(process.argv[2], 10) || 8;

async function main() {
  console.log(`Running bulk-fill (${rounds} rounds)...`);
  const res = await fetch(`${url}/api/bulk-fill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rounds }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Failed:', data);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
  console.log(`\nTotal published: ${data.totalPublished}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
