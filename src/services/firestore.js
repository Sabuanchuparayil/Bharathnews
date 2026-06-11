'use client';

import { getDbAsync, firestoreOps } from '@/lib/firebase-client';

const emptyPage = { articles: [], lastDoc: null, hasMore: false };

export const getArticles = async (category = null, lastDoc = null, pageSize = 20) => {
  const { articles } = await getArticlesPage(category, lastDoc, pageSize);
  return articles;
};

export const getArticlesPage = async (category = null, lastDoc = null, pageSize = 20, language = null) => {
  const db = await getDbAsync();
  if (!db) return emptyPage;
  const { collection, query, where, orderBy, limit, startAfter, getDocs } = await firestoreOps();
  let q;
  const filters = [];
  if (category && category !== 'all') {
    filters.push(where('category', '==', category));
  }
  if (language && language !== 'all') {
    filters.push(where('language', '==', language));
  }
  if (filters.length === 0) {
    q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(pageSize));
  } else if (filters.length === 1) {
    q = query(collection(db, 'articles'), filters[0], orderBy('publishedAt', 'desc'), limit(pageSize));
  } else {
    q = query(collection(db, 'articles'), ...filters, orderBy('publishedAt', 'desc'), limit(pageSize));
  }
  if (lastDoc) {
    if (filters.length === 0) {
      q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else if (filters.length === 1) {
      q = query(collection(db, 'articles'), filters[0], orderBy('publishedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(collection(db, 'articles'), ...filters, orderBy('publishedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }
  }
  const snapshot = await getDocs(q);
  const articles = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => !a.editorialStatus || a.editorialStatus === 'published');
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
  return { articles, lastDoc: lastVisible, hasMore: snapshot.docs.length === pageSize };
};

export const getArticleBySlug = async (slug) => {
  const db = await getDbAsync();
  if (!db) return null;
  const { collection, query, where, limit, getDocs } = await firestoreOps();
  const q = query(collection(db, 'articles'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
};

export const getTrendingArticles = async (count = 5) => {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, orderBy, limit, getDocs } = await firestoreOps();
  const q = query(collection(db, 'articles'), orderBy('views', 'desc'), limit(count + 10));
  const snapshot = await getDocs(q);
  const seen = new Set();
  const articles = [];
  for (const d of snapshot.docs) {
    const data = { id: d.id, ...d.data() };
    if (!data.slug || seen.has(data.slug)) continue;
    seen.add(data.slug);
    articles.push(data);
    if (articles.length >= count) break;
  }
  return articles;
};

export const getArticlesByInterests = async (interests, count = 10) => {
  const topCategories = Object.entries(interests.categories || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  if (topCategories.length === 0) return getTrendingArticles(count);

  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, where, orderBy, limit, getDocs } = await firestoreOps();
  const q = query(
    collection(db, 'articles'),
    where('category', 'in', topCategories),
    orderBy('score', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const trackArticleView = async (articleId) => {
  const db = await getDbAsync();
  if (!db) return;
  const viewedKey = `viewed_${articleId}`;
  if (typeof window !== 'undefined' && sessionStorage.getItem(viewedKey)) return;
  const { doc, updateDoc, increment } = await firestoreOps();
  const ref = doc(db, 'articles', articleId);
  await updateDoc(ref, { views: increment(1) });
  if (typeof window !== 'undefined') sessionStorage.setItem(viewedKey, '1');
};

export const trackUserInteraction = async (userId, articleId, action, metadata = {}) => {
  const db = await getDbAsync();
  if (!db) return;
  const { collection, addDoc, serverTimestamp } = await firestoreOps();
  await addDoc(collection(db, 'users', userId, 'history'), {
    articleId,
    action,
    ...metadata,
    timestamp: serverTimestamp(),
  });
};

export const addBookmark = async (userId, articleId) => {
  const db = await getDbAsync();
  if (!db) return;
  const { doc, updateDoc, arrayUnion } = await firestoreOps();
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { bookmarks: arrayUnion(articleId) });
};

export const removeBookmark = async (userId, articleId) => {
  const db = await getDbAsync();
  if (!db) return;
  const { doc, updateDoc, arrayRemove } = await firestoreOps();
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { bookmarks: arrayRemove(articleId) });
};

export const toggleBookmark = async (userId, articleId, isBookmarked) => {
  if (isBookmarked) await removeBookmark(userId, articleId);
  else await addBookmark(userId, articleId);
};

export const getBookmarks = async (userId) => {
  const db = await getDbAsync();
  if (!db) return [];
  const { doc, getDoc } = await firestoreOps();
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.data()?.bookmarks || [];
};

export const toggleLike = async (userId, articleId, isLiked) => {
  const db = await getDbAsync();
  if (!db) return;
  const { doc, updateDoc, increment, arrayUnion, arrayRemove } = await firestoreOps();
  const userRef = doc(db, 'users', userId);
  const articleRef = doc(db, 'articles', articleId);
  if (isLiked) {
    await updateDoc(userRef, { likes: arrayRemove(articleId) });
    await updateDoc(articleRef, { likes: increment(-1) });
  } else {
    await updateDoc(userRef, { likes: arrayUnion(articleId) });
    await updateDoc(articleRef, { likes: increment(1) });
  }
};

export const subscribeNewsletter = async (email) => {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const { collection, query, where, limit, getDocs, addDoc, serverTimestamp } = await firestoreOps();
  const normalized = email.toLowerCase().trim();
  const existing = await getDocs(
    query(collection(db, 'subscribers'), where('email', '==', normalized), limit(1))
  );
  if (!existing.empty) {
    throw new Error('ALREADY_SUBSCRIBED');
  }
  await addDoc(collection(db, 'subscribers'), {
    email: normalized,
    subscribedAt: serverTimestamp(),
    source: 'website',
  });
};

export const getSubscriberCount = async () => {
  const db = await getDbAsync();
  if (!db) return 0;
  const { collection, getDocs } = await firestoreOps();
  const snap = await getDocs(collection(db, 'subscribers'));
  return snap.size;
};

export const searchArticles = async (searchTerm, pageSize = 30) => {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, where, orderBy, limit, getDocs } = await firestoreOps();
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];

  const queries = [
    query(collection(db, 'articles'), where('category', '==', term), orderBy('publishedAt', 'desc'), limit(pageSize)),
    query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(200)),
  ];

  const results = await Promise.all(queries.map(q => getDocs(q)));
  const seen = new Set();
  const articles = [];

  for (const snapshot of results) {
    for (const d of snapshot.docs) {
      if (seen.has(d.id)) continue;
      const data = { id: d.id, ...d.data() };
      const matchesTerm =
        data.title?.toLowerCase().includes(term) ||
        data.summary?.toLowerCase().includes(term) ||
        data.category?.toLowerCase().includes(term) ||
        data.author?.toLowerCase().includes(term);
      if (matchesTerm) {
        seen.add(d.id);
        articles.push(data);
      }
    }
  }

  return articles.slice(0, pageSize);
};

export const getArticlesByIds = async (articleIds) => {
  const db = await getDbAsync();
  if (!db || !articleIds.length) return [];
  const { collection, query, where, getDocs } = await firestoreOps();
  const chunks = [];
  for (let i = 0; i < articleIds.length; i += 30) {
    chunks.push(articleIds.slice(i, i + 30));
  }
  const results = await Promise.all(
    chunks.map(chunk =>
      getDocs(query(collection(db, 'articles'), where('__name__', 'in', chunk)))
    )
  );
  return results.flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
};

export const getVideoFeeds = async (category = null, count = 20) => {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, where, orderBy, limit, getDocs } = await firestoreOps();
  let q = query(collection(db, 'videos'), orderBy('fetchedAt', 'desc'), limit(count));
  if (category) {
    q = query(collection(db, 'videos'), where('category', '==', category), orderBy('fetchedAt', 'desc'), limit(count));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};
