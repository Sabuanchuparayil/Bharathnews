import { ADMIN_ROLES, VALID_ROLES } from './roles';
import { fallbackCaps, isRoleId } from './access-roles';

const MAX_AGE = 86400; // 24 hours

function cookieFlags() {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `path=/; max-age=${MAX_AGE}; SameSite=Strict${secure}`;
}

export function setAuthCookies(role = 'reader', flags = {}) {
  if (typeof document === 'undefined') return;
  const safeRole = isRoleId(role) ? role : 'reader';
  const verified = flags.emailVerified === true ? '1' : '0';
  const profile = flags.profileComplete === true ? '1' : '0';
  const caps = Array.isArray(flags.caps) ? flags.caps : fallbackCaps(safeRole);
  const capValue = caps.length ? caps.join('.') : '0';
  document.cookie = `bn_auth=1; ${cookieFlags()}`;
  document.cookie = `bn_role=${safeRole}; ${cookieFlags()}`;
  document.cookie = `bn_caps=${capValue}; ${cookieFlags()}`;
  document.cookie = `bn_verified=${verified}; ${cookieFlags()}`;
  document.cookie = `bn_profile=${profile}; ${cookieFlags()}`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'bn_auth=; path=/; max-age=0';
  document.cookie = 'bn_role=; path=/; max-age=0';
  document.cookie = 'bn_caps=; path=/; max-age=0';
  document.cookie = 'bn_verified=; path=/; max-age=0';
  document.cookie = 'bn_profile=; path=/; max-age=0';
}

export { ADMIN_ROLES, VALID_ROLES as VALID_ROLE_SET };
export const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/settings', '/bookmarks', '/creator', '/employer', '/jobs/post', '/jobs/my', '/classifieds/post', '/classifieds/my'];
