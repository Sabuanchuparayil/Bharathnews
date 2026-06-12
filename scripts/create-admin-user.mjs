#!/usr/bin/env node
/**
 * Create (or update) a Firebase Auth user with email/password and set Firestore role to admin.
 *
 * Usage:
 *   node scripts/create-admin-user.mjs <email> <password> [service-account.json]
 */

import { readFileSync, existsSync } from 'fs';
import { createSign } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'thebharathnews-app';

const email = process.argv[2];
const password = process.argv[3];

if (!email?.includes('@') || !password) {
  console.error('Usage: node scripts/create-admin-user.mjs <email> <password> [service-account.json]');
  process.exit(1);
}

function resolveServiceAccountPath() {
  let saPath = process.argv[4] || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
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
  console.error('Service account JSON not found.');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, 'utf8'));

async function getAccessToken(scopes) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: scopes.join(' '),
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
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || data.error || 'Token request failed');
  return data.access_token;
}

async function lookupUser(token, lookupEmail) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email: [lookupEmail] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.users?.[0] || null;
}

async function createAuthUser(token) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      email,
      password,
      emailVerified: true,
      disabled: false,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.localId;
}

async function updateAuthPassword(token, localId) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      localId,
      password,
      emailVerified: true,
      disabled: false,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return localId;
}

function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map(item => ({ stringValue: String(item) })) } };
    }
  }
  return fields;
}

async function upsertFirestoreUser(token, uid) {
  const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const res = await fetch(`https://firestore.googleapis.com/v1/${docPath}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fields: toFields({
        email,
        displayName: email.split('@')[0],
        role: 'admin',
        language: 'all',
        bookmarks: [],
        likes: [],
        interests: { categories: {}, topics: [], sources: {}, readingTimes: {} },
      }),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore upsert failed: ${err}`);
  }
}

const authToken = await getAccessToken([
  'https://www.googleapis.com/auth/identitytoolkit',
  'https://www.googleapis.com/auth/cloud-platform',
]);

let uid;
const existing = await lookupUser(authToken, email).catch(() => null);

if (existing?.localId) {
  uid = existing.localId;
  console.log(`User already exists (${uid}), updating password and admin role…`);
  await updateAuthPassword(authToken, uid);
} else {
  console.log('Creating new Firebase Auth user…');
  uid = await createAuthUser(authToken);
}

const dbToken = await getAccessToken(['https://www.googleapis.com/auth/datastore']);
await upsertFirestoreUser(dbToken, uid);

console.log(`✓ Admin ready: ${email} (uid: ${uid})`);
console.log('Sign in at /login with email and password.');
