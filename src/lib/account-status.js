export const ACCOUNT_STATUSES = ['active', 'suspended', 'deactivated'];

export const STATUS_LABELS = {
  active: 'Active',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
};

/** Ban length used to block sign-in at the auth layer (~100 years). */
export const BAN_DURATION = '876000h';

export function isAccountStatus(value) {
  return typeof value === 'string' && ACCOUNT_STATUSES.includes(value);
}

/** Returns an `{ error, status }` object for blocked accounts, or null when access is allowed. */
export function blockedAccountError(accountStatus) {
  if (!accountStatus || accountStatus === 'active') return null;
  const label = accountStatus === 'deactivated' ? 'deactivated' : 'suspended';
  return { error: `This account has been ${label}. Contact the site owner.`, status: 403 };
}
