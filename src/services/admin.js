'use client';

import { getDbAsync, firestoreOps } from '@/lib/firebase-client';
import { mergeSiteSettings } from '@/lib/site-settings';

function filterPublished(articles) {
  return articles.filter(a =>
    !a.editorialStatus || a.editorialStatus === 'published'
  );
}

export async function getAdminStats() {
  const db = await getDbAsync();
  if (!db) return null;
  const { collection, getDocs, query, orderBy, limit, where } = await firestoreOps();

  const [articlesSnap, rawSnap, sourcesSnap, subsSnap, usersSnap] = await Promise.all([
    getDocs(query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(200))),
    getDocs(collection(db, 'raw_articles')),
    getDocs(collection(db, 'sources')),
    getDocs(collection(db, 'subscribers')),
    getDocs(query(collection(db, 'users'), limit(500))),
  ]);

  const articles = articlesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const rawArticles = rawSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const sources = sourcesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const pipeline = { pending: 0, classified: 0, processed: 0, rejected: 0, duplicate: 0 };
  for (const r of rawArticles) {
    const s = r.status || 'unknown';
    if (pipeline[s] !== undefined) pipeline[s]++;
    else pipeline.pending++;
  }

  const byCategory = {};
  const byLanguage = {};
  let totalViews = 0;
  for (const a of articles) {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    byLanguage[a.language || 'en'] = (byLanguage[a.language || 'en'] || 0) + 1;
    totalViews += a.views || 0;
  }

  const topArticles = [...articles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  return {
    totalArticles: articles.length,
    totalViews,
    subscribers: subsSnap.size,
    users: usersSnap.size,
    sources: sources.length,
    enabledSources: sources.filter(s => s.enabled).length,
    pipeline,
    byCategory: Object.entries(byCategory).map(([name, count]) => ({ name, count })),
    byLanguage: Object.entries(byLanguage).map(([name, count]) => ({ name, count })),
    topArticles,
    dailyViews: articles.slice(0, 7).map((a, i) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i % 7],
      views: a.views || 0,
    })),
  };
}

export async function getSources() {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, getDocs, orderBy, query } = await firestoreOps();
  const snap = await getDocs(query(collection(db, 'sources'), orderBy('name')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createSource(data) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { collection, doc, setDoc, serverTimestamp } = await firestoreOps();
  const id = data.id || slugifySourceId(data.name);
  await setDoc(doc(db, 'sources', id), {
    name: data.name,
    url: data.url || '',
    category: data.category || 'india',
    language: data.language || 'en',
    type: data.type || 'rss',
    region: data.region || '',
    enabled: data.enabled !== false,
    trustWeight: data.trustWeight ?? 0.85,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

export async function deleteSource(sourceId) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, deleteDoc } = await firestoreOps();
  await deleteDoc(doc(db, 'sources', sourceId));
}

function slugifySourceId(name) {
  return String(name || 'source')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `source-${Date.now()}`;
}

export async function getSubscribers(limitCount = 100) {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, getDocs, query, limit } = await firestoreOps();
  const snap = await getDocs(query(collection(db, 'subscribers'), limit(limitCount)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getVideos(limitCount = 50) {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, getDocs, query, limit, orderBy } = await firestoreOps();
  const snap = await getDocs(query(collection(db, 'videos'), orderBy('fetchedAt', 'desc'), limit(limitCount)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateVideo(videoId, data) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, updateDoc } = await firestoreOps();
  await updateDoc(doc(db, 'videos', videoId), data);
}

export async function deleteVideo(videoId) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, deleteDoc } = await firestoreOps();
  await deleteDoc(doc(db, 'videos', videoId));
}

export async function updateSource(sourceId, data) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, updateDoc } = await firestoreOps();
  await updateDoc(doc(db, 'sources', sourceId), data);
}

export async function getSiteSettings() {
  const db = await getDbAsync();
  if (!db) return mergeSiteSettings();
  const { doc, getDoc } = await firestoreOps();
  const snap = await getDoc(doc(db, 'settings', 'site'));
  return snap.exists() ? mergeSiteSettings(snap.data()) : mergeSiteSettings();
}

export async function updateSiteSettings(data) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, setDoc } = await firestoreOps();
  await setDoc(doc(db, 'settings', 'site'), data, { merge: true });
}

export async function getUsers({ pageSize = 25, startAfterDoc = null, search = '' } = {}) {
  const db = await getDbAsync();
  if (!db) return { users: [], hasMore: false, lastDoc: null };
  const { collection, getDocs, query, limit, orderBy, startAfter } = await firestoreOps();

  let q = query(collection(db, 'users'), orderBy('email'), limit(pageSize + 1));
  if (startAfterDoc) {
    q = query(collection(db, 'users'), orderBy('email'), startAfter(startAfterDoc), limit(pageSize + 1));
  }

  const snap = await getDocs(q);
  let users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (search.trim()) {
    const term = search.trim().toLowerCase();
    users = users.filter(u =>
      (u.email || '').toLowerCase().includes(term)
      || (u.displayName || '').toLowerCase().includes(term)
    );
  }

  const hasMore = snap.docs.length > pageSize;
  const pageDocs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
  if (hasMore) users = users.slice(0, pageSize);

  const lastDoc = pageDocs.length ? pageDocs[pageDocs.length - 1] : null;
  return { users, hasMore, lastDoc };
}

/** @deprecated Use getUsers({ pageSize }) */
export async function getUsersLegacy(limitCount = 50) {
  const { users } = await getUsers({ pageSize: limitCount });
  return users;
}

const ALLOWED_ROLES = ['reader', 'contributor', 'vlogger', 'content_writer', 'admin'];

export async function setUserRole(userId, role) {
  if (!userId || typeof userId !== 'string') throw new Error('Invalid userId');
  if (!ALLOWED_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, updateDoc } = await firestoreOps();
  await updateDoc(doc(db, 'users', userId), { role });
}

export { filterPublished };
