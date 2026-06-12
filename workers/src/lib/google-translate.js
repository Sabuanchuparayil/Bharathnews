/**
 * Google Cloud Translation API (NMT) — on-demand article translation.
 * Auth: GOOGLE_TRANSLATE_API_KEY (preferred) or FIREBASE_SERVICE_ACCOUNT_JSON OAuth.
 */

const TRANSLATE_SCOPE = 'https://www.googleapis.com/auth/cloud-translation';
const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

let cachedToken = null;
let tokenExpiry = 0;

function base64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJWT(sa, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope,
  })));

  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const keyBuf = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );

  const signInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = base64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signInput));
  return `${header}.${payload}.${signature}`;
}

async function getAccessToken(env) {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Translation not configured (missing service account).');

  const sa = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const jwt = await signJWT(sa, TRANSLATE_SCOPE);
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
    throw new Error(data.error_description || data.error || 'Google auth failed');
  }

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Translate one or more plain-text strings via Google NMT (v2).
 * @returns {Promise<string[]>} translated strings in the same order
 */
export async function translateTexts(env, { texts, sourceLang, targetLang }) {
  const items = texts.map(t => (t || '').trim());
  if (!items.some(Boolean)) return items;
  if (sourceLang === targetLang) return items;

  const body = {
    q: items,
    target: targetLang,
    format: 'text',
  };
  if (sourceLang) body.source = sourceLang;

  let url = TRANSLATE_URL;
  const headers = { 'Content-Type': 'application/json' };

  if (env.GOOGLE_TRANSLATE_API_KEY) {
    url += `?key=${encodeURIComponent(env.GOOGLE_TRANSLATE_API_KEY)}`;
  } else {
    headers.Authorization = `Bearer ${await getAccessToken(env)}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Google Translate HTTP ${res.status}`;
    throw new Error(msg);
  }

  const translations = data?.data?.translations;
  if (!Array.isArray(translations) || translations.length !== items.length) {
    throw new Error('Unexpected Google Translate response');
  }

  return translations.map((t, i) => t.translatedText ?? items[i]);
}

/** Translate article fields (title, summary, body) in one batched NMT request. */
export async function translateArticleFields(env, { title, summary, fullContent, sourceLang, targetLang }) {
  const body = (fullContent || '').slice(0, 30000);
  const [translatedTitle, translatedSummary, translatedBody] = await translateTexts(env, {
    texts: [title || '', summary || '', body],
    sourceLang: sourceLang || 'en',
    targetLang,
  });

  return {
    title: translatedTitle || title || '',
    summary: translatedSummary || summary || '',
    fullContent: translatedBody || body,
    provider: 'google-nmt',
  };
}
