import { getSupabaseAdmin } from './supabase-server';
import { editorialSourceName, readSiteSettings } from './site-settings';
import { rowToApp, rowsToApp } from './db-mapper';
import { slugify } from '@/utils/slugify';
import { ROLE_TITLES } from './staff-profiles-client';

function cleanText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function migrationHint(message) {
  if (/staff_profiles|author_photo_url|author_title|schema cache|does not exist/i.test(message || '')) {
    return 'Run supabase/migrations/20261110120000_staff_profiles.sql in the Supabase SQL editor.';
  }
  return '';
}

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function profileName(row) {
  return row?.displayName ?? row?.display_name ?? '';
}

function profileEmail(row) {
  return String(row?.email || '').trim().toLowerCase();
}

function profileTitle(row) {
  return row?.title || '';
}

function profileUserId(row) {
  return row?.userId || row?.user_id || '';
}

/** Lower-case name with punctuation removed, for comparing bylines to accounts. */
export function normalizePersonName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The shared newsroom byline is not a person and must not be merged into an account. */
function isSharedDesk(row) {
  const name = normalizePersonName(profileName(row));
  const title = normalizePersonName(profileTitle(row));
  return name === 'bharath news desk' || (title === 'newsroom' && /\bdesk\b/.test(name));
}

/**
 * True when two profiles are one person.
 * Two different sign-ins are never combined. A shared desk byline is never combined with a person.
 * "Navas" matches "Navas Nemom" when the role title is the same. "Satheesh Vellayambalam" matches itself.
 */
export function profilesAreSamePerson(a, b) {
  if (!a || !b) return false;
  if (isSharedDesk(a) || isSharedDesk(b)) {
    return isSharedDesk(a) && isSharedDesk(b)
      && normalizePersonName(profileName(a)) === normalizePersonName(profileName(b));
  }
  const aUser = profileUserId(a);
  const bUser = profileUserId(b);
  if (aUser && bUser && aUser !== bUser) return false;
  const aEmail = profileEmail(a);
  const bEmail = profileEmail(b);
  if (aEmail && bEmail && aEmail === bEmail) return true;
  const left = normalizePersonName(profileName(a));
  const right = normalizePersonName(profileName(b));
  if (!left || !right || left.length < 4 || right.length < 4) return false;
  if (left === right) return true;
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  if (!longer.startsWith(`${shorter} `)) return false;
  const aTitle = normalizePersonName(profileTitle(a));
  const bTitle = normalizePersonName(profileTitle(b));
  if (aTitle && bTitle && aTitle !== bTitle) return false;
  return true;
}

function betterAuthorProfile(a, b, accountMap) {
  const score = (profile) => {
    const userId = profileUserId(profile);
    const status = userId ? (accountMap.get(userId)?.status || 'active') : '';
    const photo = profile.photoURL || profile.photo_url || '';
    const active = profile.isActive !== false && profile.is_active !== false;
    return [
      userId && status === 'active' ? 1 : 0,
      userId ? 1 : 0,
      active ? 1 : 0,
      photo ? 1 : 0,
      -Number(profile.sortOrder ?? profile.sort_order ?? 100),
      profileName(profile).length,
    ];
  };
  const left = score(a);
  const right = score(b);
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return left[i] > right[i] ? a : b;
  }
  return a;
}

/** Marks the extra copy. The account byline wins over a byline with no sign-in. */
export function annotateStaffDuplicates(profiles, accountMap = new Map()) {
  return profiles.map(profile => {
    const others = profiles.filter(item => item.id !== profile.id && profilesAreSamePerson(profile, item));
    if (!others.length) return profile;
    const best = others.reduce((keep, item) => betterAuthorProfile(keep, item, accountMap), profile);
    if (best.id === profile.id) return profile;
    return {
      ...profile,
      duplicateOf: {
        id: best.id,
        displayName: profileName(best),
        hasAccount: Boolean(profileUserId(best)),
      },
    };
  });
}

/** Author lists show one byline per person. A hidden byline stays off the list. */
export function staffAuthorChoices(profiles, accountMap = new Map()) {
  const annotated = annotateStaffDuplicates(profiles, accountMap);
  const eligible = new Set(annotated
    .filter(profile => profile.isActive !== false)
    .map(profile => profile.id));
  return annotated
    .filter(profile => eligible.has(profile.id) && (!profile.duplicateOf || !eligible.has(profile.duplicateOf.id)))
    .map(({ duplicateOf, account, ...profile }) => profile);
}

async function loadAccountMap(supabase, profiles) {
  const userIds = [...new Set(profiles.map(profile => profile.userId).filter(Boolean))];
  if (!userIds.length) return new Map();
  const { data, error } = await supabase.from('users').select('id, email, role, status').in('id', userIds);
  if (error) throw new Error(error.message || 'Could not load linked accounts.');
  return new Map((data || []).map(account => [account.id, account]));
}

export function validateStaffInput(body, { partial = false } = {}) {
  const displayName = cleanText(body.displayName || body.display_name, 80);
  const title = cleanText(body.title, 80);
  const photoURL = cleanText(body.photoURL || body.photo_url, 500);
  const bio = String(body.bio || '').trim().slice(0, 2000);
  const email = cleanText(body.email, 120).toLowerCase();
  const slug = slugify(body.slug || displayName);
  const sortOrder = Number.isFinite(Number(body.sortOrder ?? body.sort_order))
    ? Math.max(0, Math.min(9999, Math.round(Number(body.sortOrder ?? body.sort_order))))
    : 100;
  const isActive = body.isActive !== false && body.is_active !== false;

  // Topic assignments for content routing.
  const rawTopics = Array.isArray(body.assignedTopics || body.assigned_topics)
    ? (body.assignedTopics || body.assigned_topics)
    : [];
  const assignedTopics = rawTopics
    .map(t => cleanText(t, 40).toLowerCase())
    .filter(Boolean)
    .slice(0, 20);

  if (!partial || body.displayName !== undefined || body.display_name !== undefined) {
    if (displayName.length < 2) return { error: 'Add a display name.' };
  }
  if (!partial || body.slug !== undefined || body.displayName !== undefined) {
    if (!slug || slug.length < 2) return { error: 'Add a valid profile slug.' };
  }
  if (photoURL && !/^https?:\/\//i.test(photoURL)) {
    return { error: 'Photo must be an http(s) URL.' };
  }
  if (title && title.length > 80) return { error: 'Role title is too long.' };

  return {
    value: {
      displayName,
      title: title || 'Reporter',
      photoURL,
      bio,
      email,
      slug,
      sortOrder,
      isActive,
      assignedTopics,
    },
  };
}

const PUBLIC_STAFF_FIELDS = [
  'id', 'slug', 'displayName', 'title', 'photoURL', 'bio', 'sortOrder', 'isActive',
  'assignedTopics',
];

export function toPublicStaffProfile(profile) {
  if (!profile) return null;
  const out = {};
  for (const key of PUBLIC_STAFF_FIELDS) {
    if (profile[key] !== undefined) out[key] = profile[key];
  }
  return out;
}

export async function listStaffProfiles({ activeOnly = true, withAccounts = false, forChoices = false } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('staff_profiles')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('display_name', { ascending: true });
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) {
    const err = new Error(error.message || 'Could not load staff profiles.');
    err.hint = migrationHint(error.message);
    throw err;
  }

  let profiles = rowsToApp(data || []);
  const accountMap = await loadAccountMap(supabase, profiles);
  if (withAccounts) {
    profiles = profiles.map(profile => {
      if (!profile.userId) return profile;
      const account = accountMap.get(profile.userId);
      return account
        ? { ...profile, account: { email: account.email, role: account.role, status: account.status || 'active' } }
        : profile;
    });
  }
  if (forChoices) return staffAuthorChoices(profiles, accountMap);
  return annotateStaffDuplicates(profiles, accountMap);
}

export async function getStaffBySlug(slug) {
  const safe = slugify(slug);
  if (!safe) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('slug', safe)
    .maybeSingle();
  if (error) {
    const err = new Error(error.message || 'Could not load staff profile.');
    err.hint = migrationHint(error.message);
    throw err;
  }
  return data ? rowToApp(data) : null;
}

export async function resolveStaffAuthor({ author, authorSlug } = {}) {
  const supabase = getSupabaseAdmin();
  const slug = slugify(authorSlug || '');
  if (slug) {
    const { data } = await supabase.from('staff_profiles').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
    if (data) {
      const profile = rowToApp(data);
      return {
        author: profile.displayName,
        authorSlug: profile.slug,
        authorPhotoUrl: profile.photoURL || '',
        authorTitle: profile.title || '',
      };
    }
  }

  const name = cleanText(author, 80);
  if (name) {
    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('is_active', true)
      .ilike('display_name', name)
      .limit(1)
      .maybeSingle();
    if (data) {
      const profile = rowToApp(data);
      return {
        author: profile.displayName,
        authorSlug: profile.slug,
        authorPhotoUrl: profile.photoURL || '',
        authorTitle: profile.title || '',
      };
    }
  }

  return {
    author: name || 'Bharath News Desk',
    authorSlug: null,
    authorPhotoUrl: '',
    authorTitle: '',
  };
}

/** Use an existing unlinked byline instead of inserting a second profile for the same person. */
async function adoptUnlinkedProfile(supabase, { userId, input, keepLongerName = false }) {
  const probe = {
    displayName: input.displayName,
    email: input.email,
    title: input.title,
    userId: '',
  };
  const { data, error } = await supabase.from('staff_profiles').select('*').is('user_id', null);
  if (error) {
    const err = new Error(error.message || 'Could not look up staff profiles.');
    err.hint = migrationHint(error.message);
    throw err;
  }
  const matches = (data || []).filter(row => !isSharedDesk(row) && profilesAreSamePerson(probe, row));
  if (!matches.length) return null;
  matches.sort((a, b) => {
    const rank = (row) => {
      const exact = normalizePersonName(row.display_name) === normalizePersonName(probe.displayName) ? 4 : 0;
      const email = profileEmail(probe) && profileEmail(row) === profileEmail(probe) ? 2 : 0;
      const active = row.is_active === false ? 0 : 1;
      return exact + email + active;
    };
    return rank(b) - rank(a);
  });
  const match = matches[0];
  const matchName = match.display_name || '';
  const useExistingName = keepLongerName
    && normalizePersonName(matchName).length > normalizePersonName(input.displayName).length;
  const now = new Date().toISOString();
  const patch = {
    user_id: userId,
    display_name: useExistingName ? matchName : (input.displayName || matchName),
    title: input.title || match.title || 'Reporter',
    email: input.email || match.email || '',
    is_active: input.isActive !== false,
    updated_at: now,
  };
  if (input.photoURL) patch.photo_url = input.photoURL;
  if (input.bio) patch.bio = input.bio;
  if (Array.isArray(input.assignedTopics) && input.assignedTopics.length) {
    patch.assigned_topics = input.assignedTopics;
  }
  const { data: saved, error: updateError } = await supabase
    .from('staff_profiles')
    .update(patch)
    .eq('id', match.id)
    .is('user_id', null)
    .select('*')
    .single();
  if (updateError) {
    const err = new Error(updateError.message || 'Could not link the existing byline.');
    err.hint = migrationHint(updateError.message);
    throw err;
  }
  return rowToApp(saved);
}

/** Creates, retitles, or deactivates the board seat linked to a user account. */
export async function syncUserEditorialSeat(supabase, { userId, email, displayName, title, board }) {
  if (!userId || board === 'keep') return { editorialTitle: '' };

  const { data: existing, error } = await supabase
    .from('staff_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    const err = new Error(error.message || 'Could not update the editorial board.');
    err.hint = migrationHint(error.message);
    throw err;
  }

  const now = new Date().toISOString();
  if (board === 'clear') {
    if (existing) {
      const { error: updateError } = await supabase
        .from('staff_profiles')
        .update({ is_active: false, updated_at: now })
        .eq('id', existing.id);
      if (updateError) throw new Error(updateError.message || 'Could not update the editorial board.');
    }
    return { editorialTitle: '' };
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('staff_profiles')
      .update({ title, is_active: true, email: email || '', updated_at: now })
      .eq('id', existing.id);
    if (updateError) throw new Error(updateError.message || 'Could not update the editorial board.');
    return { editorialTitle: title };
  }

  const name = cleanText(displayName, 80) || cleanText(String(email || '').split('@')[0], 80) || 'Editor';
  const adopted = await adoptUnlinkedProfile(supabase, {
    userId,
    keepLongerName: true,
    input: { displayName: name, title, email: email || '', isActive: true },
  });
  if (adopted) return { editorialTitle: adopted.title || title };

  const base = slugify(name) || 'editor';
  let slug = base;
  for (let n = 2; n < 30; n += 1) {
    const { data: clash } = await supabase.from('staff_profiles').select('id').eq('slug', slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${n}`.slice(0, 48);
  }

  const { error: insertError } = await supabase.from('staff_profiles').insert({
    slug,
    display_name: name,
    title,
    photo_url: '',
    bio: '',
    email: email || '',
    sort_order: 100,
    is_active: true,
    assigned_topics: [],
    user_id: userId,
    created_at: now,
    updated_at: now,
  });
  if (insertError) {
    const err = new Error(insertError.message || 'Could not add this person to the editorial board.');
    err.hint = migrationHint(insertError.message);
    throw err;
  }
  return { editorialTitle: title };
}

/** Puts a user's board seat back to the row captured before a failed role change. */
export async function restoreEditorialSeat(supabase, userId, previous) {
  if (!userId) return;
  if (!previous) {
    const { error } = await supabase.from('staff_profiles').delete().eq('user_id', userId);
    if (error) throw new Error(error.message || 'Could not restore the editorial board seat.');
    return;
  }
  const { error } = await supabase.from('staff_profiles').update({
    title: previous.title,
    is_active: previous.is_active,
    email: previous.email || '',
    display_name: previous.display_name,
  }).eq('id', previous.id);
  if (error) throw new Error(error.message || 'Could not restore the editorial board seat.');
}

export async function createStaffProfile(input, { userId = null } = {}) {
  const supabase = getSupabaseAdmin();
  if (userId) {
    const { data: linked } = await supabase.from('staff_profiles').select('id').eq('user_id', userId).maybeSingle();
    if (linked) throw httpError('This user account is already linked to another staff profile.', 409);
    const adopted = await adoptUnlinkedProfile(supabase, { userId, input });
    if (adopted) return adopted;
  }

  const { data: existing } = await supabase.from('staff_profiles').select('id').eq('slug', input.slug).maybeSingle();
  if (existing) {
    const err = new Error('That slug is already used by another staff profile.');
    err.status = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const row = {
    slug: input.slug,
    display_name: input.displayName,
    title: input.title,
    photo_url: input.photoURL,
    bio: input.bio,
    email: input.email,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    assigned_topics: input.assignedTopics || [],
    created_at: now,
    updated_at: now,
  };
  if (userId) row.user_id = userId;

  const { data, error } = await supabase.from('staff_profiles').insert(row).select('*').single();

  if (error) {
    const err = new Error(error.message || 'Could not create staff profile.');
    err.hint = migrationHint(error.message);
    throw err;
  }
  return rowToApp(data);
}

export async function updateStaffProfile(id, input) {
  const supabase = getSupabaseAdmin();
  const { data: current } = await supabase.from('staff_profiles').select('*').eq('id', id).maybeSingle();
  if (!current) {
    const err = new Error('Staff profile not found.');
    err.status = 404;
    throw err;
  }

  if (input.slug && input.slug !== current.slug) {
    const { data: clash } = await supabase.from('staff_profiles').select('id').eq('slug', input.slug).maybeSingle();
    if (clash) {
      const err = new Error('That slug is already used by another staff profile.');
      err.status = 409;
      throw err;
    }
  }

  const patch = {
    slug: input.slug,
    display_name: input.displayName,
    title: input.title,
    photo_url: input.photoURL,
    bio: input.bio,
    email: input.email,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    assigned_topics: input.assignedTopics || [],
    updated_at: new Date().toISOString(),
  };
  // Allow linking/unlinking a user account.
  if (input.userId !== undefined) patch.user_id = input.userId || null;

  const { data, error } = await supabase.from('staff_profiles').update(patch).eq('id', id).select('*').single();

  if (error) {
    const err = new Error(error.message || 'Could not update staff profile.');
    err.hint = migrationHint(error.message);
    throw err;
  }
  return rowToApp(data);
}

export async function linkStaffToUser(staffId, userId) {
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase.from('staff_profiles').select('id, user_id').eq('id', staffId).maybeSingle();
  if (!profile) {
    const err = new Error('Staff profile not found.');
    err.status = 404;
    throw err;
  }
  if (profile.user_id === userId) {
    const { data: full, error } = await supabase.from('staff_profiles').select('*').eq('id', staffId).single();
    if (error) throw new Error(error.message || 'Could not load staff profile.');
    return { profile: rowToApp(full), absorbed: false };
  }

  if (userId) {
    const { data: clash } = await supabase.from('staff_profiles').select('id').eq('user_id', userId).maybeSingle();
    if (clash && clash.id !== staffId) {
      const kept = await absorbStaffProfile(clash.id, staffId);
      return { profile: kept, absorbed: true };
    }
  }

  const { data, error } = await supabase
    .from('staff_profiles')
    .update({ user_id: userId || null, updated_at: new Date().toISOString() })
    .eq('id', staffId)
    .select('*')
    .single();
  if (error) throw new Error(error.message || 'Could not link staff profile.');
  return { profile: rowToApp(data), absorbed: false };
}

/**
 * Moves stories from an extra byline onto the one we keep, then removes the extra row.
 * Refuses when the names do not match, so two different people are not combined.
 */
export async function absorbStaffProfile(keepId, dropId) {
  if (!keepId || !dropId || keepId === dropId) {
    throw httpError('Choose the byline to keep and the copy to remove.', 400);
  }
  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase.from('staff_profiles').select('*').in('id', [keepId, dropId]);
  if (error) throw new Error(error.message || 'Could not load staff profiles.');
  const keep = (rows || []).find(row => row.id === keepId);
  const drop = (rows || []).find(row => row.id === dropId);
  if (!keep || !drop) throw httpError('Staff profile not found.', 404);
  if (isSharedDesk(drop) || isSharedDesk(keep)) {
    throw httpError('The newsroom desk byline stays separate from a person’s account.', 400);
  }
  if (!profilesAreSamePerson(keep, drop)) {
    throw httpError('These profiles do not look like the same person, so they were left separate.', 400);
  }
  const keepUser = keep.user_id || '';
  const dropUser = drop.user_id || '';
  if (keepUser && dropUser && keepUser !== dropUser) {
    throw httpError('Both profiles have their own sign-in. Unlink one before combining them.', 409);
  }

  const displayName = keep.display_name || drop.display_name || '';
  const photo = keep.photo_url || drop.photo_url || '';
  const bio = keep.bio || drop.bio || '';
  const email = keep.email || drop.email || '';
  const title = keep.title || drop.title || '';
  const topics = Array.isArray(keep.assigned_topics) && keep.assigned_topics.length
    ? keep.assigned_topics
    : (drop.assigned_topics || []);
  const now = new Date().toISOString();
  const byline = {
    author: displayName,
    author_slug: keep.slug,
    author_title: title,
    author_photo_url: photo,
  };

  const { error: moveError } = await supabase.from('articles').update(byline).eq('author_slug', drop.slug);
  if (moveError) throw new Error(moveError.message || 'Could not move stories onto the kept byline.');
  if (displayName !== (keep.display_name || '') || photo !== (keep.photo_url || '') || title !== (keep.title || '')) {
    const { error: renameError } = await supabase.from('articles').update({
      author: displayName,
      author_title: title,
      author_photo_url: photo,
    }).eq('author_slug', keep.slug);
    if (renameError) throw new Error(renameError.message || 'Could not update stories that already use this byline.');
  }

  if (dropUser) {
    const { error: clearError } = await supabase
      .from('staff_profiles')
      .update({ user_id: null, updated_at: now })
      .eq('id', drop.id);
    if (clearError) throw new Error(clearError.message || 'Could not detach the extra byline.');
  }

  const { error: keepError } = await supabase.from('staff_profiles').update({
    display_name: displayName,
    title,
    photo_url: photo,
    bio,
    email,
    assigned_topics: topics,
    user_id: keepUser || dropUser || null,
    is_active: true,
    updated_at: now,
  }).eq('id', keep.id);
  if (keepError) throw new Error(keepError.message || 'Could not update the kept byline.');

  const { error: deleteError } = await supabase.from('staff_profiles').delete().eq('id', drop.id);
  if (deleteError) {
    await supabase.from('staff_profiles').update({
      is_active: false,
      user_id: null,
      updated_at: now,
    }).eq('id', drop.id);
  }

  const { data: fresh, error: freshError } = await supabase.from('staff_profiles').select('*').eq('id', keep.id).single();
  if (freshError) throw new Error(freshError.message || 'Could not load the kept byline.');
  return rowToApp(fresh);
}

export async function listArticlesByAuthorSlug(slug, { limit = 24 } = {}) {
  const safe = slugify(slug);
  if (!safe) return [];
  const supabase = getSupabaseAdmin();
  const settings = await readSiteSettings(supabase);
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('author_slug', safe)
    .eq('source', editorialSourceName(settings))
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return rowsToApp(data || []);
}

export { ROLE_TITLES } from './staff-profiles-client';
