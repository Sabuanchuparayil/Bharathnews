/**
 * Generate a Firebase/Google access token inside the worker
 * using a service account JSON stored as a secret.
 *
 * Falls back to env.FIREBASE_TOKEN if the service account is not set.
 */

let cachedToken = null;
let tokenExpiry = 0;

function base64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJWT(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })));

  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const keyBuf = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = base64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signInput));
  return `${header}.${payload}.${signature}`;
}

export async function getFirebaseToken(env) {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const sa = typeof env.FIREBASE_SERVICE_ACCOUNT_JSON === 'string'
        ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : env.FIREBASE_SERVICE_ACCOUNT_JSON;

      const jwt = await signJWT(sa);
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        cachedToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
        return cachedToken;
      }
      console.error('Token exchange failed:', data.error_description || data.error);
    } catch (err) {
      console.error('JWT signing failed:', err.message);
    }
  }

  if (env.FIREBASE_TOKEN) return env.FIREBASE_TOKEN;

  throw new Error('No Firebase credentials available — set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_TOKEN');
}
