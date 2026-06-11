'use client';

import { getDbAsync, firestoreOps } from '@/lib/firebase-client';

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

export async function updateSource(sourceId, data) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, updateDoc } = await firestoreOps();
  await updateDoc(doc(db, 'sources', sourceId), data);
}

export async function getSiteSettings() {
  const db = await getDbAsync();
  if (!db) return { qualityThreshold: 6 };
  const { doc, getDoc } = await firestoreOps();
  const snap = await getDoc(doc(db, 'settings', 'site'));
  return snap.exists() ? snap.data() : { qualityThreshold: 6 };
}

export async function updateSiteSettings(data) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, setDoc } = await firestoreOps();
  await setDoc(doc(db, 'settings', 'site'), data, { merge: true });
}

export async function getUsers(limitCount = 50) {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, getDocs, query, limit } = await firestoreOps();
  const snap = await getDocs(query(collection(db, 'users'), limit(limitCount)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setUserRole(userId, role) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { doc, updateDoc } = await firestoreOps();
  await updateDoc(doc(db, 'users', userId), { role });
}

export { filterPublished };
