'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';
import { mergeSiteSettings } from '@/lib/site-settings';
import { requestPasswordReset } from '@/lib/password-reset';
import { isAccountStatus } from '@/lib/account-status';
import { ALLOWED_ROLES } from '@/lib/roles';

export { ALLOWED_ROLES };

function filterPublished(articles) {
  return articles.filter(a =>
    !a.editorialStatus || a.editorialStatus === 'published'
  );
}

async function getAdminAccessToken() {
  const supabase = getSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('You must be signed in as admin.');
  return session.access_token;
}

export async function adminFetch(path, { method = 'GET', body } = {}) {
  const token = await getAdminAccessToken();
  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

export async function getAdminStats() {
  return adminFetch('/api/admin/stats');
}

export async function getSources() {
  const data = await adminFetch('/api/admin/sources');
  return data.sources || [];
}

export async function createSource(source) {
  const data = await adminFetch('/api/admin/sources', { method: 'POST', body: source });
  return data.id;
}

export async function deleteSource(sourceId) {
  if (!sourceId || typeof sourceId !== 'string') throw new Error('Invalid source.');
  await adminFetch(`/api/admin/sources/${encodeURIComponent(sourceId)}`, { method: 'DELETE' });
}

export async function updateSource(sourceId, source) {
  if (!sourceId || typeof sourceId !== 'string') throw new Error('Invalid source.');
  await adminFetch(`/api/admin/sources/${encodeURIComponent(sourceId)}`, { method: 'PATCH', body: source });
}

export async function getSubscribers(limitCount = 200) {
  const data = await adminFetch(`/api/admin/subscribers?limit=${encodeURIComponent(limitCount)}`);
  return { subscribers: data.subscribers || [], total: data.total || 0 };
}

export async function getVideos(limitCount = 50) {
  const data = await adminFetch(`/api/admin/videos?limit=${encodeURIComponent(limitCount)}`);
  return { videos: data.videos || [], total: data.total || 0 };
}

export async function updateVideo(videoId, data) {
  if (!videoId || typeof videoId !== 'string') throw new Error('Invalid video.');
  await adminFetch(`/api/admin/videos/${encodeURIComponent(videoId)}`, { method: 'PATCH', body: data });
}

export async function deleteVideo(videoId) {
  if (!videoId || typeof videoId !== 'string') throw new Error('Invalid video.');
  await adminFetch(`/api/admin/videos/${encodeURIComponent(videoId)}`, { method: 'DELETE' });
}

export async function getSiteSettings() {
  const data = await adminFetch('/api/admin/settings');
  return mergeSiteSettings(data.settings);
}

export async function updateSiteSettings(settings) {
  const data = await adminFetch('/api/admin/settings', { method: 'PUT', body: settings });
  return mergeSiteSettings(data.settings);
}

export async function getModerationQueue() {
  return adminFetch('/api/admin/moderation');
}

export async function reviewRoleApplication(applicationId, { approved, feedback } = {}) {
  if (!applicationId || typeof applicationId !== 'string') throw new Error('Invalid application.');
  return adminFetch('/api/admin/moderation', {
    method: 'POST',
    body: { kind: 'application', id: applicationId, approved: approved === true, feedback: feedback || '' },
  });
}

export async function moderateCreatorPost(postId, { approved, feedback } = {}) {
  if (!postId || typeof postId !== 'string') throw new Error('Invalid post.');
  return adminFetch('/api/admin/moderation', {
    method: 'POST',
    body: { kind: 'post', id: postId, approved: approved === true, feedback: feedback || '' },
  });
}

/**
 * Admin user directory. Goes through a server route because row-level security only lets a
 * browser session read its own `users` row; search and status filters run server-side.
 */
export async function getUsers({ pageSize = 25, startAfterDoc = null, search = '', status = 'all' } = {}) {
  const offset = startAfterDoc?._offset || 0;
  const token = await getAdminAccessToken();
  const params = new URLSearchParams({ pageSize: String(pageSize), offset: String(offset), status });
  if (search.trim()) params.set('search', search.trim());

  const res = await fetch(`/api/admin/users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not load users.');

  return {
    users: data.users || [],
    total: data.total ?? 0,
    hasMore: data.hasMore === true,
    lastDoc: data.hasMore ? { _offset: offset + pageSize } : null,
  };
}

export async function getUsersLegacy(limitCount = 50) {
  const { users } = await getUsers({ pageSize: limitCount });
  return users;
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
  const token = await getAdminAccessToken();
  const res = await fetch('/api/admin/users/role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update role.');
  return data;
}

export async function resetUserPassword(userId, newPassword) {
  if (!userId || typeof userId !== 'string') throw new Error('Invalid userId');
  if (typeof newPassword !== 'string' || newPassword.length < 8) throw new Error('Password must be at least 8 characters.');
  const token = await getAdminAccessToken();
  const res = await fetch('/api/admin/users/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
  return data;
}

export async function setUserStatus(userId, status, reason = '') {
  if (!userId || typeof userId !== 'string') throw new Error('Invalid userId');
  if (!isAccountStatus(status)) throw new Error(`Invalid status: ${status}`);
  if (typeof reason !== 'string') throw new Error('Reason must be text.');
  const token = await getAdminAccessToken();
  const res = await fetch('/api/admin/users/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, status, reason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update account status.');
  return data;
}

export async function sendPasswordResetEmail(email) {
  await requestPasswordReset(email);
}

export { filterPublished };
