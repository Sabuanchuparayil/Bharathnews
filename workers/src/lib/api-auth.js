/**
 * Protect manual worker API triggers with a shared secret.
 * Set WORKER_API_SECRET via: npx wrangler secret put WORKER_API_SECRET
 * Cron jobs bypass this (they run in scheduled(), not fetch()).
 */

const PROTECTED_PREFIXES = [
  '/api/ingest',
  '/api/classify',
  '/api/process',
  '/api/distribute',
  '/api/videos',
  '/api/newsletter',
  '/api/reset-rejected',
  '/api/reset-pipeline',
  '/api/fast-publish',
  '/api/bulk-fill',
  '/api/seo-update',
  '/api/fix-slugs',
];

export function isProtectedApiPath(pathname) {
  return PROTECTED_PREFIXES.some(p => pathname === p);
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.byteLength !== bufB.byteLength) {
    const dummy = enc.encode(a);
    crypto.subtle.timingSafeEqual?.(dummy, dummy);
    return false;
  }
  if (crypto.subtle.timingSafeEqual) {
    return crypto.subtle.timingSafeEqual(bufA, bufB);
  }
  let result = 0;
  for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}

export function requireApiSecret(request, env) {
  const secret = env.WORKER_API_SECRET;
  if (!secret) {
    console.warn('[api-auth] WORKER_API_SECRET is not set — blocking request. Configure via: npx wrangler secret put WORKER_API_SECRET');
    return new Response(JSON.stringify({ error: 'API not configured — WORKER_API_SECRET missing' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = request.headers.get('Authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const apiKey = request.headers.get('X-API-Key') || '';
  const token = bearer || apiKey;

  if (!token || !timingSafeEqual(token, secret)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
