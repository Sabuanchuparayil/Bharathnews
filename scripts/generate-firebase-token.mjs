#!/usr/bin/env node
/**
 * Generate a Google OAuth access token from a Firebase service account JSON.
 * Usage: node scripts/generate-firebase-token.mjs path/to/service-account.json
 *
 * Download the key from:
 * Firebase Console → Project Settings → Service accounts → Generate new private key
 */

import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Usage: node scripts/generate-firebase-token.mjs <service-account.json>');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
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

const signInput = `${header}.${payload}`;
const sign = createSign('RSA-SHA256');
sign.update(signInput);
sign.end();
const signature = sign.sign(sa.private_key).toString('base64url');
const jwt = `${signInput}.${signature}`;

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
  console.error('Failed to get access token:', data);
  process.exit(1);
}

console.log(data.access_token);
