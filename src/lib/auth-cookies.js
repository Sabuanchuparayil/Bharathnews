const MAX_AGE = 86400; // 24 hours
const VALID_ROLES = new Set(['reader', 'admin', 'content_writer', 'contributor', 'vlogger']);

function cookieFlags() {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `path=/; max-age=${MAX_AGE}; SameSite=Strict${secure}`;
}

export function setAuthCookies(role = 'reader') {
  if (typeof document === 'undefined') return;
  const safeRole = VALID_ROLES.has(role) ? role : 'reader';
  document.cookie = `bn_auth=1; ${cookieFlags()}`;
  document.cookie = `bn_role=${safeRole}; ${cookieFlags()}`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'bn_auth=; path=/; max-age=0';
  document.cookie = 'bn_role=; path=/; max-age=0';
}

export const ADMIN_ROLES = new Set(['admin']);
export const VALID_ROLE_SET = VALID_ROLES;
export const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/settings', '/bookmarks', '/creator'];
