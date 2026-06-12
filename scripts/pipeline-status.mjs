#!/usr/bin/env node
/**
 * Check Cloudflare Worker pipeline status.
 *
 * Usage:
 *   WORKER_API_SECRET=... node scripts/pipeline-status.mjs
 *   # or set WORKER_API_SECRET in workers/secrets.env
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WORKER_URL = (process.env.WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev').replace(/\/$/, '');

function resolveSecret() {
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

const secret = resolveSecret();
if (!secret) {
  console.error('Set WORKER_API_SECRET or add it to workers/secrets.env');
  process.exit(1);
}

const res = await fetch(`${WORKER_URL}/api/pipeline-status`, {
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Failed:', res.status, body);
  process.exit(1);
}
console.log(JSON.stringify(body, null, 2));
