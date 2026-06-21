'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';
import { rowToApp, rowsToApp } from '@/lib/db-mapper';
import { mergeSiteSettings } from '@/lib/site-settings';

function filterPublished(articles) {
  return articles.filter(a =>
    !a.editorialStatus || a.editorialStatus === 'published'
  );
}

export async function getAdminStats() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const [articlesRes, rawRes, sourcesRes, subsRes, usersRes] = await Promise.all([
    supabase.from('articles').select('*').order('published_at', { ascending: false }).limit(200),
    supabase.from('raw_articles').select('status'),
    supabase.from('sources').select('*'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact' }).limit(500),
  ]);

  const articles = rowsToApp(articlesRes.data || []);
  const rawArticles = rowsToApp(rawRes.data || []);
  const sources = rowsToApp(sourcesRes.data || []);

  const pipeline = { pending: 0, classified: 0, processed: 0, rejected: 0, duplicate: 0 };
  for (const r of rawArticles) {
    const s = r.status || 'unknown';
    if (pipeline[s] !== undefined) pipeline[s]++;
    else pipeline.pending++;
  }

  const byCategory = {};
  const byLanguage = {};
  for (const a of articles) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    byLanguage[a.language || 'en'] = (byLanguage[a.language || 'en'] || 0) + 1;
  }

  const topArticles = articles.slice(0, 5);
  const sourcesWithErrors = sources.filter(s => s.enabled !== false && s.lastError).length;

  return {
    totalArticles: articles.length,
    subscribers: subsRes.count || 0,
    users: usersRes.count || 0,
    sources: sources.length,
    enabledSources: sources.filter(s => s.enabled).length,
    sourcesWithErrors,
    pipeline,
    byCategory: Object.entries(byCategory).map(([name, count]) => ({ name, count })),
    byLanguage: Object.entries(byLanguage).map(([name, count]) => ({ name, count })),
    topArticles,
  };
}

export async function getSources() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase.from('sources').select('*').order('name');
  return rowsToApp(data || []);
}

export async function createSource(data) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Database unavailable');
  const id = data.id || slugifySourceId(data.name);
  const { error } = await supabase.from('sources').insert({
    id,
    name: data.name,
    url: data.url || '',
    category: data.category || 'india',
    language: data.language || 'en',
    type: data.type || 'rss',
    region: data.region || '',
    enabled: data.enabled !== false,
    trust_weight: data.trustWeight ?? 0.85,
  });
  if (error) throw error;
  return id;
}

export async function deleteSource(sourceId) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Database unavailable');
  await supabase.from('sources').delete().eq('id', sourceId);
}

function slugifySourceId(name) {
  return String(name || 'source')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `source-${Date.now()}`;
}

export async function getSubscribers(limitCount = 100) {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase.from('subscribers').select('*').limit(limitCount);
  return rowsToApp(data || []);
}

export async function getVideos(limitCount = 50) {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];
  const { data } = await supabase.from('videos').select('*').order('fetched_at', { ascending: false }).limit(limitCount);
  return rowsToApp(data || []);
}

export async function updateVideo(videoId, data) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Database unavailable');
  const row = {};
  if (data.title !== undefined) row.title = data.title;
  if (data.category !== undefined) row.category = data.category;
  await supabase.from('videos').update(row).eq('id', videoId);
}

export async function deleteVideo(videoId) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Database unavailable');
  await supabase.from('videos').delete().eq('id', videoId);
}

export async function updateSource(sourceId, data) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Database unavailable');
  const row = {};
  Object.entries(data).forEach(([k, v]) => {
    row[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = v;
  });
  await supabase.from('sources').update(row).eq('id', sourceId);
}

export async function getSiteSettings() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return mergeSiteSettings();
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle();
  return data?.value ? mergeSiteSettings(data.value) : mergeSiteSettings();
}

export async function updateSiteSettings(data) {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Database unavailable');
  const current = await getSiteSettings();
  await supabase.from('site_settings').upsert({
    key: 'site',
    value: { ...current, ...data },
  });
}

export async function getUsers({ pageSize = 25, startAfterDoc = null, search = '' } = {}) {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { users: [], hasMore: false, lastDoc: null };

  const offset = startAfterDoc?._offset || 0;
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('email')
    .range(offset, offset + pageSize);

  let users = rowsToApp(data || []);
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    users = users.filter(u =>
      (u.email || '').toLowerCase().includes(term)
      || (u.displayName || '').toLowerCase().includes(term)
    );
  }

  const hasMore = (data?.length || 0) > pageSize;
  if (hasMore) users = users.slice(0, pageSize);

  return {
    users,
    hasMore,
    lastDoc: hasMore ? { _offset: offset + pageSize } : null,
  };
}

export async function getUsersLegacy(limitCount = 50) {
  const { users } = await getUsers({ pageSize: limitCount });
  return users;
}

export const ALLOWED_ROLES = ['reader', 'contributor', 'vlogger', 'content_writer', 'admin'];

async function getAdminAccessToken() {
  const supabase = getSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('You must be signed in as admin.');
  return session.access_token;
}

export async function createAdminUser({ email, password, displayName, role }) {
  if (!ALLOWED_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
  const token = await getAdminAccessToken();
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password, displayName, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to create user.');
  return data.user;
}

export async function setUserRole(userId, role) {
  if (!userId || typeof userId !== 'string') throw new Error('Invalid userId');
  if (!ALLOWED_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Database unavailable');
  await supabase.from('users').update({ role }).eq('id', userId);
}

export { filterPublished };
