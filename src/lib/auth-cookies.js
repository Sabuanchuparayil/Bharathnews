const MAX_AGE = 86400; // 24 hours
const VALID_ROLES = new Set(['reader', 'admin', 'content_writer', 'contributor', 'vlogger', 'employer']);

function cookieFlags() {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `path=/; max-age=${MAX_AGE}; SameSite=Strict${secure}`;
}

export function setAuthCookies(role = 'reader', flags = {}) {
  if (typeof document === 'undefined') return;
  const safeRole = VALID_ROLES.has(role) ? role : 'reader';
  const verified = flags.emailVerified === true ? '1' : '0';
  const profile = flags.profileComplete === true ? '1' : '0';
  document.cookie = `bn_auth=1; ${cookieFlags()}`;
  document.cookie = `bn_role=${safeRole}; ${cookieFlags()}`;
  document.cookie = `bn_verified=${verified}; ${cookieFlags()}`;
  document.cookie = `bn_profile=${profile}; ${cookieFlags()}`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'bn_auth=; path=/; max-age=0';
  document.cookie = 'bn_role=; path=/; max-age=0';
  document.cookie = 'bn_verified=; path=/; max-age=0';
  document.cookie = 'bn_profile=; path=/; max-age=0';
}

export const ADMIN_ROLES = new Set(['admin']);
export const VALID_ROLE_SET = VALID_ROLES;
export const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/settings', '/bookmarks', '/creator', '/employer', '/jobs/post', '/jobs/my', '/classifieds/post', '/classifieds/my'];
