/** Supabase auth users expose `id`. Older call sites still pass `uid`. */
export function sessionUserId(user) {
  if (!user || typeof user !== 'object') return '';
  return user.id || user.uid || '';
}
