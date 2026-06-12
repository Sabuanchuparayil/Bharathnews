#!/usr/bin/env node
/**
 * Promote a user to admin by email.
 *
 * Usage:
 *   npm run set-first-admin user@example.com [path/to/service-account.json]
 *
 * The user must have signed in at least once (users/{uid} doc must exist).
 */

import { readFileSync, existsSync } from 'fs';
import { createSign } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'thebharathnews-app';

const email = process.argv[2];
if (!email || !email.includes('@')) {
  console.error('Usage: npm run set-first-admin <email> [service-account.json]');
  process.exit(1);
}

function resolveServiceAccountPath() {
  let saPath = process.argv[3] || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
  if (!saPath) {
    const secretsEnv = join(ROOT, 'workers/secrets.env');
    if (existsSync(secretsEnv)) {
      const line = readFileSync(secretsEnv, 'utf8')
        .split('\n')
        .find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
      if (line) saPath = line.split('=').slice(1).join('=').trim();
    }
  }
  return saPath || null;
}

const saPath = resolveServiceAccountPath();
if (!saPath || !existsSync(saPath)) {
  console.error('Service account JSON required. Pass as second argument or set FIREBASE_SERVICE_ACCOUNT_JSON.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, 'utf8'));

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key).toString('base64url');
  const jwt = `${header}.${payload}.${sig}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const { access_token, error } = await res.json();
  if (error) throw new Error(error);
  return access_token;
}

async function findUserByEmail(token, targetEmail) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'email' },
            op: 'EQUAL',
            value: { stringValue: targetEmail },
          },
        },
        limit: 1,
      },
    }),
  });
  const data = await res.json();
  const doc = Array.isArray(data) ? data.find(d => d.document)?.document : null;
  return doc;
}

async function setAdminRole(token, docName) {
  const res = await fetch(`https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: { role: { stringValue: 'admin' } } }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

const token = await getToken();
const doc = await findUserByEmail(token, email);

if (!doc) {
  console.error(`No user found with email: ${email}`);
  console.error('The user must sign in at least once before being promoted to admin.');
  process.exit(1);
}

await setAdminRole(token, doc.name);
const uid = doc.name.split('/').pop();
console.log(`✓ ${email} (${uid}) is now admin.`);
console.log('Ask them to sign out and sign back in to refresh their session.');
