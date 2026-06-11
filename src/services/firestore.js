import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
  increment, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

export const getArticles = async (category = null, lastDoc = null, pageSize = 20) => {
  const { articles } = await getArticlesPage(category, lastDoc, pageSize);
  return articles;
};

export const getArticlesPage = async (category = null, lastDoc = null, pageSize = 20) => {
  let q;
  if (category && category !== 'all') {
    q = query(collection(db, 'articles'), where('category', '==', category), orderBy('publishedAt', 'desc'), limit(pageSize));
  } else {
    q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(pageSize));
  }
  if (lastDoc) {
    if (category && category !== 'all') {
      q = query(collection(db, 'articles'), where('category', '==', category), orderBy('publishedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }
  }
  const snapshot = await getDocs(q);
  const articles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
  return { articles, lastDoc: lastVisible, hasMore: snapshot.docs.length === pageSize };
};

export const getArticleBySlug = async (slug) => {
  const q = query(collection(db, 'articles'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
};

export const getTrendingArticles = async (count = 5) => {
  const q = query(collection(db, 'articles'), orderBy('views', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getArticlesByInterests = async (interests, count = 10) => {
  const topCategories = Object.entries(interests.categories || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  if (topCategories.length === 0) return getTrendingArticles(count);

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
  const viewedKey = `viewed_${articleId}`;
  if (typeof window !== 'undefined' && sessionStorage.getItem(viewedKey)) return;
  const ref = doc(db, 'articles', articleId);
  await updateDoc(ref, { views: increment(1) });
  if (typeof window !== 'undefined') sessionStorage.setItem(viewedKey, '1');
};

export const trackUserInteraction = async (userId, articleId, action, metadata = {}) => {
  await addDoc(collection(db, 'users', userId, 'history'), {
    articleId,
    action,
    ...metadata,
    timestamp: serverTimestamp(),
  });
};

export const addBookmark = async (userId, articleId) => {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { bookmarks: arrayUnion(articleId) });
};

export const removeBookmark = async (userId, articleId) => {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { bookmarks: arrayRemove(articleId) });
};

export const toggleBookmark = async (userId, articleId, isBookmarked) => {
  if (isBookmarked) await removeBookmark(userId, articleId);
  else await addBookmark(userId, articleId);
};

export const getBookmarks = async (userId) => {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.data()?.bookmarks || [];
};

export const toggleLike = async (userId, articleId, isLiked) => {
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
  const snap = await getDocs(collection(db, 'subscribers'));
  return snap.size;
};

// For production full-text search, consider Algolia or Typesense synced from Firestore.
export const searchArticles = async (searchTerm, pageSize = 30) => {
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
  if (!articleIds.length) return [];
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
  let q = query(collection(db, 'videos'), orderBy('fetchedAt', 'desc'), limit(count));
  if (category) {
    q = query(collection(db, 'videos'), where('category', '==', category), orderBy('fetchedAt', 'desc'), limit(count));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};
