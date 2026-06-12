#!/usr/bin/env node
/**
 * Add Firebase Auth authorized domains.
 * Uses firebase-tools session if logged in, otherwise a service account JSON.
 *
 * Usage:
 *   npm run firebase:auth-domains
 *   node scripts/update-auth-domains.mjs thebharathnews.com www.thebharathnews.com
 *   node scripts/update-auth-domains.mjs --sa /path/to/service-account.json
 *
 * Auth (in order): Firebase CLI session (`firebase login`), then service account via
 * FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, --sa, or workers/secrets.env.
 */

import { readFileSync, existsSync } from 'fs';
import { createSign } from 'crypto';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { resolveProjectId } from './firebase-admin-utils.mjs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PROJECT_ID = resolveProjectId();
const IDENTITY_API = 'https://identitytoolkit.googleapis.com';

const DEFAULT_DOMAINS = [
  'thebharathnews.com',
  'www.thebharathnews.com',
  'thebharathnews-app.firebaseapp.com',
  'localhost',
  '127.0.0.1',
];

function parseArgs(argv) {
  const domains = [];
  let saPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--sa' && argv[i + 1]) {
      saPath = argv[++i];
    } else if (!argv[i].startsWith('--')) {
      domains.push(argv[i].replace(/^https?:\/\//, '').replace(/\/$/, ''));
    }
  }

  if (!saPath && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  if (!saPath) {
    const secretsEnv = join(ROOT, 'workers/secrets.env');
    if (existsSync(secretsEnv)) {
      const line = readFileSync(secretsEnv, 'utf8')
        .split('\n')
        .find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
      if (line) saPath = line.split('=').slice(1).join('=').trim();
    }
  }

  return { domains: domains.length ? domains : DEFAULT_DOMAINS, saPath: saPath || null };
}

async function tokenFromServiceAccount(saPath) {
  if (!existsSync(saPath)) {
    throw new Error(`Service account not found: ${saPath}`);
  }
  const sa = JSON.parse(readFileSync(saPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const jwt = `${header}.${payload}.${sign.sign(sa.private_key).toString('base64url')}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Service account token failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function initializeAuthIfNeeded(token) {
  const res = await fetch(
    `${IDENTITY_API}/v2/projects/${PROJECT_ID}/identityPlatform:initializeAuth`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': PROJECT_ID,
      },
    },
  );
  if (res.ok || res.status === 409) return;
  const body = await res.text();
  if (body.includes('ALREADY_EXISTS') || body.includes('already')) return;
  console.warn('initializeAuth response:', res.status, body.slice(0, 200));
}

async function getDomainsViaServiceAccount(token) {
  const res = await fetch(`${IDENTITY_API}/admin/v2/projects/${PROJECT_ID}/config`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-user-project': PROJECT_ID,
    },
  });
  if (res.status === 404) {
    await initializeAuthIfNeeded(token);
    const retry = await fetch(`${IDENTITY_API}/admin/v2/projects/${PROJECT_ID}/config`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-goog-user-project': PROJECT_ID,
      },
    });
    if (!retry.ok) {
      throw new Error(`GET config failed ${retry.status}: ${(await retry.text()).slice(0, 200)}`);
    }
    const data = await retry.json();
    return data.authorizedDomains || [];
  }
  if (!res.ok) {
    throw new Error(`GET config failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  return data.authorizedDomains || [];
}

async function updateDomainsViaServiceAccount(token, authDomains) {
  const res = await fetch(
    `${IDENTITY_API}/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': PROJECT_ID,
      },
      body: JSON.stringify({ authorizedDomains: authDomains }),
    },
  );
  if (!res.ok) {
    throw new Error(`PATCH config failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return data.authorizedDomains || authDomains;
}

async function updateViaFirebaseTools(toAdd) {
  const { getAuthDomains, updateAuthDomains } = require('firebase-tools/lib/gcp/auth');
  const current = (await getAuthDomains(PROJECT_ID)) || [];
  const merged = [...current];
  for (const domain of toAdd) {
    if (!merged.includes(domain)) merged.push(domain);
  }
  if (merged.length === current.length) return merged;
  return updateAuthDomains(PROJECT_ID, merged);
}

async function updateViaServiceAccount(toAdd, saPath) {
  if (!saPath) {
    throw new Error(
      'No service account path. Set FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, --sa, or workers/secrets.env',
    );
  }
  if (!existsSync(saPath)) {
    throw new Error(`Service account file not found: ${saPath}`);
  }

  const token = await tokenFromServiceAccount(saPath);
  const current = await getDomainsViaServiceAccount(token);
  const merged = [...current];
  for (const domain of toAdd) {
    if (!merged.includes(domain)) merged.push(domain);
  }
  if (merged.length === current.length) {
    console.log('Authorized domains already up to date (service account).');
    return merged;
  }
  const updated = await updateDomainsViaServiceAccount(token, merged);
  console.log('Updated via service account.');
  return updated;
}

async function main() {
  const { domains: toAdd, saPath } = parseArgs(process.argv.slice(2));

  let updated;
  try {
    updated = await updateViaFirebaseTools(toAdd);
    console.log('Updated via Firebase CLI session.');
  } catch (cliErr) {
    const message = cliErr?.message || String(cliErr);
    const authUnavailable = /not yet authenticated|Unable to refresh auth/i.test(message);
    if (authUnavailable) {
      console.warn('Firebase CLI session unavailable:', message);
      console.warn('Falling back to service account if configured.');
    } else {
      console.warn('Firebase CLI update failed:', message);
      console.warn('Attempting service account fallback.');
    }

    try {
      updated = await updateViaServiceAccount(toAdd, saPath);
    } catch (saErr) {
      console.error('Service account fallback failed:', saErr.message || saErr);
      if (authUnavailable) {
        console.error('Run `npx firebase login` or provide a service account via --sa / FIREBASE_SERVICE_ACCOUNT_JSON.');
      }
      throw saErr;
    }
  }

  console.log(`Project: ${PROJECT_ID}`);
  console.log('Authorized domains:');
  for (const d of updated) console.log(`  - ${d}`);
}

main().catch((err) => {
  console.error('Failed to update auth domains:', err.message || err);
  process.exit(1);
});
