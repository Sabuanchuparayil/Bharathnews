// Supabase stamps sessions opened from a recovery email with amr "otp" (older servers use
// "recovery"). Password and Google sessions never carry these, so an ordinary signed-in
// visitor can't reach the reset form.
const RECOVERY_METHODS = new Set(['recovery', 'otp']);
export const RECOVERY_WINDOW_SECONDS = 15 * 60;

function decodeJwtPayload(token) {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isRecoverySession(session, nowSeconds = Math.floor(Date.now() / 1000)) {
  const token = session?.access_token;
  if (typeof token !== 'string') return false;
  const amr = decodeJwtPayload(token)?.amr;
  if (!Array.isArray(amr)) return false;
  return amr.some(entry => (
    RECOVERY_METHODS.has(entry?.method)
    && typeof entry.timestamp === 'number'
    && nowSeconds - entry.timestamp <= RECOVERY_WINDOW_SECONDS
  ));
}

// Recovery emails are requested without PKCE, so the link carries the session in the URL
// fragment and works in any browser, not just the one that asked for it.
export function readRecoveryHash(hash) {
  if (typeof hash !== 'string' || hash.length < 2) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const description = params.get('error_description');
  if (description || params.get('error')) {
    return { error: description || 'This reset link is invalid or has expired.' };
  }
  if (params.get('type') !== 'recovery') return null;
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function requestPasswordReset(email) {
  if (typeof email !== 'string' || !email.includes('@')) {
    throw new Error('A valid email is required.');
  }
  const res = await fetch('/api/auth/password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to send reset email.');
}
