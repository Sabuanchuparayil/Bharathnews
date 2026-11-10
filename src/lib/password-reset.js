/**
 * Recovery links must go through /auth/callback so the PKCE `code` is exchanged
 * server-side (same flow as Google OAuth) before landing on /reset-password.
 * Add `<origin>/auth/callback` to the Supabase Auth redirect URL allow-list.
 */
export function getPasswordResetRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`;
}
