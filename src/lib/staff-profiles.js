import { getSupabaseAdmin } from './supabase-server';
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
    },
  };
}

const PUBLIC_STAFF_FIELDS = [
  'id', 'slug', 'displayName', 'title', 'photoURL', 'bio', 'sortOrder', 'isActive',
];

export function toPublicStaffProfile(profile) {
  if (!profile) return null;
  const out = {};
  for (const key of PUBLIC_STAFF_FIELDS) {
    if (profile[key] !== undefined) out[key] = profile[key];
  }
  return out;
}

export async function listStaffProfiles({ activeOnly = true } = {}) {
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
  return rowsToApp(data || []);
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

export async function createStaffProfile(input) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from('staff_profiles').select('id').eq('slug', input.slug).maybeSingle();
  if (existing) {
    const err = new Error('That slug is already used by another staff profile.');
    err.status = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase.from('staff_profiles').insert({
    slug: input.slug,
    display_name: input.displayName,
    title: input.title,
    photo_url: input.photoURL,
    bio: input.bio,
    email: input.email,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    created_at: now,
    updated_at: now,
  }).select('*').single();

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

  const { data, error } = await supabase.from('staff_profiles').update({
    slug: input.slug,
    display_name: input.displayName,
    title: input.title,
    photo_url: input.photoURL,
    bio: input.bio,
    email: input.email,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('*').single();

  if (error) {
    const err = new Error(error.message || 'Could not update staff profile.');
    err.hint = migrationHint(error.message);
    throw err;
  }
  return rowToApp(data);
}

export async function listArticlesByAuthorSlug(slug, { limit = 24 } = {}) {
  const safe = slugify(slug);
  if (!safe) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('author_slug', safe)
    .eq('source', 'Bharath News Editorial')
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return rowsToApp(data || []);
}

export { ROLE_TITLES } from './staff-profiles-client';
