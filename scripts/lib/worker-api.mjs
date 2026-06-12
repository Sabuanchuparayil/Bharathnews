/**
 * Headers for authenticated Cloudflare Worker pipeline calls.
 * Set WORKER_API_SECRET in workers/secrets.env or the environment.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

function resolveWorkerSecret() {
  if (process.env.WORKER_API_SECRET) return process.env.WORKER_API_SECRET;
  const secretsEnv = join(ROOT, 'workers/secrets.env');
  if (existsSync(secretsEnv)) {
    const line = readFileSync(secretsEnv, 'utf8')
      .split('\n')
      .find(l => l.startsWith('WORKER_API_SECRET='));
    if (line) return line.split('=').slice(1).join('=').trim();
  }
  return null;
}

export function workerAuthHeaders(extra = {}) {
  const headers = { ...extra };
  const secret = resolveWorkerSecret();
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}
