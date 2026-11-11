import { ALLOWED_ROLES, ROLE_LABELS } from './roles';

export const CAPABILITY_OPTIONS = [
  { id: 'admin', label: 'Admin area', detail: 'Settings, users, sources, and the rest of the admin pages' },
  { id: 'editorial', label: 'Newsroom', detail: 'Review, edit, and publish drafts' },
  { id: 'contributor', label: 'Community articles', detail: 'Submit community writing' },
  { id: 'vlogger', label: 'Community videos', detail: 'Submit community videos' },
  { id: 'employer', label: 'Employer tools', detail: 'Post jobs and classifieds after approval' },
];

const CAP_IDS = new Set(CAPABILITY_OPTIONS.map(item => item.id));

/** Every new sign-up gets `reader`, so it must never open staff areas. */
export const READER_BLOCKED_CAPS = new Set(['admin', 'editorial']);

const DEFAULT_CAPS = {
  reader: [],
  contributor: ['contributor'],
  vlogger: ['vlogger'],
  content_writer: ['editorial'],
  admin: ['admin', 'editorial', 'contributor', 'vlogger', 'employer'],
  employer: ['employer'],
};

export function defaultAccessRoles() {
  return ALLOWED_ROLES.map(id => ({
    id,
    label: ROLE_LABELS[id] || id,
    builtin: true,
    caps: [...(DEFAULT_CAPS[id] || [])],
  }));
}

export function slugifyRoleId(label) {
  const slug = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return /^[a-z][a-z0-9_]{1,31}$/.test(slug) ? slug : '';
}

export function isRoleId(value) {
  return /^[a-z][a-z0-9_]{1,31}$/.test(String(value || ''));
}

export function normalizeAccessRoles(value) {
  const defaults = defaultAccessRoles();
  const builtinIds = new Set(defaults.map(role => role.id));
  const byId = new Map(defaults.map(role => [role.id, { ...role, caps: [...role.caps] }]));
  const incoming = Array.isArray(value) ? value : [];

  for (const raw of incoming) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String(raw.id || '').trim();
    if (!isRoleId(id)) continue;
    const label = String(raw.label || '').trim().slice(0, 40);
    if (label.length < 2) continue;
    const caps = [...new Set((Array.isArray(raw.caps) ? raw.caps : []).filter(cap => CAP_IDS.has(cap)))];
    if (builtinIds.has(id)) {
      const current = byId.get(id);
      current.label = label;
      if (id === 'admin') current.caps = [...new Set(['admin', ...caps])];
      else if (id === 'reader') current.caps = caps.filter(cap => !READER_BLOCKED_CAPS.has(cap));
      else current.caps = caps;
      continue;
    }
    byId.set(id, { id, label, builtin: false, caps });
  }

  return [...byId.values()];
}

export function capsForRole(roles, id) {
  const match = (roles || []).find(role => role.id === id);
  if (match) return match.caps;
  return DEFAULT_CAPS[id] ? [...DEFAULT_CAPS[id]] : [];
}

export function roleHasCap(roles, id, cap) {
  return capsForRole(roles, id).includes(cap);
}

export function fallbackCaps(id) {
  return DEFAULT_CAPS[id] ? [...DEFAULT_CAPS[id]] : [];
}

export function adminRoleIds(roles) {
  return (roles || []).filter(role => role.caps.includes('admin')).map(role => role.id);
}

export async function readAccessRoles(supabase) {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'access_roles').maybeSingle();
  if (error) throw new Error(error.message || 'Could not load roles.');
  return normalizeAccessRoles(data?.value);
}

export async function countOtherActiveAdmins(supabase, roles, userId) {
  const ids = adminRoleIds(roles);
  if (!ids.length) return 0;
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .in('role', ids)
    .or('status.eq.active,status.is.null')
    .neq('id', userId);
  if (error) throw new Error(error.message || 'Could not verify admins.');
  return count || 0;
}
