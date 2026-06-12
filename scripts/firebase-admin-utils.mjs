import { readFileSync, existsSync } from 'fs';
import { createSign } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..');
export const IDENTITY_API = 'https://identitytoolkit.googleapis.com';
export const DEFAULT_PROJECT_ID = 'thebharathnews-app';

export function resolveServiceAccountPath(explicitPath = '') {
  let saPath = explicitPath || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
  if (!saPath) {
    const secretsEnv = join(ROOT, 'workers/secrets.env');
    if (existsSync(secretsEnv)) {
      const line = readFileSync(secretsEnv, 'utf8')
        .split('\n')
        .find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
      if (line) saPath = line.split('=').slice(1).join('=').trim();
    }
  }
  return saPath || null;
}

export function resolveProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  const secretsEnv = join(ROOT, 'workers/secrets.env');
  if (existsSync(secretsEnv)) {
    const line = readFileSync(secretsEnv, 'utf8')
      .split('\n')
      .find((l) => l.startsWith('FIREBASE_PROJECT_ID='));
    if (line) {
      const id = line.split('=').slice(1).join('=').trim();
      if (id) return id;
    }
  }
  return DEFAULT_PROJECT_ID;
}

export async function tokenFromServiceAccount(saPath) {
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

export async function identityRequest(projectId, token, path, { method = 'GET', body, query = '' } = {}) {
  const url = `${IDENTITY_API}${path}${query}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': projectId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} failed ${res.status}: ${text.slice(0, 400)}`);
  }
  return json;
}
