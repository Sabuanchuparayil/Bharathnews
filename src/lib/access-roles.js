import { ALLOWED_ROLES, ROLE_LABELS } from './roles';
import { EDITORIAL_BOARD_ROLES } from './staff-profiles-client';

export const CAPABILITY_OPTIONS = [
  { id: 'admin', label: 'Admin area', detail: 'Settings, users, sources, and the rest of the admin pages' },
  { id: 'editorial', label: 'Newsroom', detail: 'Write and edit drafts' },
  { id: 'publish', label: 'Publish', detail: 'Approve, reject, and put a story live' },
  { id: 'assign', label: 'Assign', detail: 'Hand a draft to an editor' },
  { id: 'correct', label: 'Correct', detail: 'Correct or unpublish a live story' },
  { id: 'contributor', label: 'Community articles', detail: 'Submit community writing' },
  { id: 'vlogger', label: 'Community videos', detail: 'Submit community videos' },
  { id: 'employer', label: 'Employer tools', detail: 'Post jobs and classifieds after approval' },
];

const CAP_IDS = new Set(CAPABILITY_OPTIONS.map(item => item.id));

/** Every new sign-up gets `reader`, so it must never open staff areas. */
export const READER_BLOCKED_CAPS = new Set(['admin', 'editorial', 'publish', 'assign', 'correct']);

const DEFAULT_CAPS = {
  reader: [],
  contributor: ['contributor'],
  vlogger: ['vlogger'],
  content_writer: ['editorial'],
  admin: ['admin', 'editorial', 'publish', 'assign', 'correct', 'contributor', 'vlogger', 'employer'],
  employer: ['employer'],
};

/** Editors sign off. Reporters and correspondents draft. */
const TITLE_DEFAULT_CAPS = {
  editor: ['editorial', 'publish', 'assign', 'correct'],
  editor_in_chief: ['editorial', 'publish', 'assign', 'correct'],
};

/** Board titles that sign in as Content Writer. Content Writer itself stays an account role. */
const EDITORIAL_TITLE_ROLES = EDITORIAL_BOARD_ROLES.filter(item => item.id !== 'content_writer');
const EDITORIAL_TITLE_IDS = new Set(EDITORIAL_TITLE_ROLES.map(item => item.id));

export function isEditorialTitleRole(id) {
  return EDITORIAL_TITLE_IDS.has(id);
}

export function defaultAccessRoles() {
  const accounts = ALLOWED_ROLES.map(id => ({
    id,
    label: ROLE_LABELS[id] || id,
    builtin: true,
    caps: [...(DEFAULT_CAPS[id] || [])],
  }));
  const titles = EDITORIAL_TITLE_ROLES.map(item => ({
    id: item.id,
    label: item.title,
    builtin: true,
    caps: [...(TITLE_DEFAULT_CAPS[item.id] || DEFAULT_CAPS.content_writer)],
  }));
  return [...accounts, ...titles];
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
      current.label = EDITORIAL_TITLE_IDS.has(id) ? current.label : label;
      if (id === 'admin') current.caps = [...new Set(['admin', ...caps])];
      else if (id === 'reader') current.caps = caps.filter(cap => !READER_BLOCKED_CAPS.has(cap));
      else if (EDITORIAL_TITLE_IDS.has(id)) current.caps = caps.filter(cap => cap !== 'admin');
      else current.caps = caps;
      continue;
    }
    byId.set(id, { id, label, builtin: false, caps });
  }

  const incomingIds = new Set(incoming
    .filter(raw => raw && typeof raw === 'object')
    .map(raw => String(raw.id || '').trim()));
  const writerCaps = (byId.get('content_writer')?.caps || [...DEFAULT_CAPS.content_writer])
    .filter(cap => cap !== 'admin' && cap !== 'publish' && cap !== 'assign' && cap !== 'correct');
  for (const item of EDITORIAL_TITLE_ROLES) {
    const current = byId.get(item.id);
    if (!current) continue;
    current.label = item.title;
    current.builtin = true;
    if (!incomingIds.has(item.id)) {
      current.caps = [...(TITLE_DEFAULT_CAPS[item.id] || writerCaps)];
    }
  }

  return [...byId.values()];
}

export function capsForRole(roles, id) {
  const match = (roles || []).find(role => role.id === id);
  if (match) return match.caps;
  return DEFAULT_CAPS[id] ? [...DEFAULT_CAPS[id]] : [];
}

/**
 * Permissions for a signed-in person. Editorial board titles keep the Content Writer
 * account and use the title's own row once that row is in the catalog.
 */
/** Match a staff title or board id, including spacing and hyphen differences. */
export function boardRoleFromLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const slug = lower.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return EDITORIAL_TITLE_ROLES.find(item =>
    item.title.toLowerCase() === lower
    || item.id === lower
    || item.id === slug
  ) || null;
}

export function capsForProfile(roles, profile) {
  const accountRole = profile?.role || 'reader';
  const accountCaps = capsForRole(roles, accountRole);
  if (accountRole !== 'content_writer') return accountCaps;
  const board = boardRoleFromLabel(profile?.editorialTitle) || boardRoleFromLabel(profile?.boardId);
  if (!board) return accountCaps;
  const match = (roles || []).find(role => role.id === board.id);
  return match ? [...match.caps] : accountCaps;
}

export function roleHasCap(roles, id, cap) {
  return capsForRole(roles, id).includes(cap);
}

/** Admin keeps every newsroom action. Other roles need the capability itself. */
export function capsAllow(caps, cap) {
  const list = caps instanceof Set ? [...caps] : (Array.isArray(caps) ? caps : []);
  return list.includes('admin') || list.includes(cap);
}

export function fallbackCaps(id) {
  return DEFAULT_CAPS[id] ? [...DEFAULT_CAPS[id]] : [];
}

/**
 * Turns a Manage Users selection into the account role plus what should happen
 * to that person's editorial board seat.
 * `board:editor` keeps the account as Content Writer and sets the board title.
 */
export function resolveRoleAssignment(value, accessRoles) {
  const raw = String(value || '').trim();
  if (raw.startsWith('seat:')) {
    const title = raw.slice('seat:'.length).trim().slice(0, 80);
    if (title.length < 2) return { error: 'Choose an editorial role.' };
    return { accountRole: 'content_writer', editorialTitle: title, board: 'keep' };
  }
  if (raw.startsWith('board:')) {
    const board = EDITORIAL_BOARD_ROLES.find(item => item.id === raw.slice('board:'.length));
    if (!board) return { error: 'Choose an editorial role.' };
    return { accountRole: 'content_writer', editorialTitle: board.title, board: 'set' };
  }

  const access = (accessRoles || []).find(item => item.id === raw);
  if (!access) return { error: 'Choose one of the access roles.' };

  const known = EDITORIAL_BOARD_ROLES.find(item => item.id === access.id);
  if (known) {
    return {
      accountRole: 'content_writer',
      editorialTitle: known.title,
      board: 'set',
    };
  }
  if (access.caps.includes('editorial') && !access.caps.includes('admin')) {
    return {
      accountRole: access.id,
      editorialTitle: access.label,
      board: 'set',
    };
  }
  if (access.caps.includes('admin')) {
    return { accountRole: access.id, editorialTitle: '', board: 'keep' };
  }
  return { accountRole: access.id, editorialTitle: '', board: 'clear' };
}

export function adminRoleIds(roles) {
  return (roles || []).filter(role => role.caps.includes('admin')).map(role => role.id);
}

/** Caps for a user row, including an active editorial-board title. */
export async function capsForUser(supabase, profile, userId) {
  const roles = await readAccessRoles(supabase);
  let editorialTitle = '';
  if ((profile?.role || 'reader') === 'content_writer' && userId) {
    const { data: seat } = await supabase
      .from('staff_profiles')
      .select('title, is_active')
      .eq('user_id', userId)
      .maybeSingle();
    if (seat?.is_active && seat.title) editorialTitle = seat.title;
  }
  return {
    roles,
    caps: capsForProfile(roles, { role: profile?.role, editorialTitle }),
  };
}

export async function readAccessRoles(supabase) {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'access_roles').maybeSingle();
  if (error) throw new Error(error.message || 'Could not load roles.');
  return normalizeAccessRoles(data?.value);
}

/** Reads the catalog through the public REST endpoint, for code that has no Supabase client (middleware). */
export async function fetchAccessRolesPublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/site_settings?key=eq.access_roles&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return normalizeAccessRoles(Array.isArray(rows) ? rows[0]?.value : null);
  } catch {
    return null;
  }
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
