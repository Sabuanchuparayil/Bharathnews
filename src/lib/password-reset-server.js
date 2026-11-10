import { createClient } from '@supabase/supabase-js';
import { getSiteUrl } from './site-url';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function normalizeResetEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

// The Host header is caller-controlled, so only trust it for local development.
export function resolveResetOrigin(request) {
  const origin = new URL(request.url).origin;
  const site = getSiteUrl();
  if (origin === site || LOCAL_ORIGIN.test(origin)) return origin;
  return site;
}

export async function sendRecoveryEmail(email, origin) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const err = new Error('Authentication service unavailable.');
    err.status = 503;
    throw err;
  }

  // Implicit flow: no PKCE verifier is tied to the requesting browser.
  const client = createClient(url, key, {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (!error) return;

  const limited = error.status === 429;
  const err = new Error(limited
    ? 'Too many reset emails were requested. Try again in a few minutes.'
    : (error.message || 'Could not send the reset email.'));
  err.status = limited ? 429 : 502;
  throw err;
}
