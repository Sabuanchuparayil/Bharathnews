import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
  increment, arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

export const getArticles = async (category = null, lastDoc = null, pageSize = 20) => {
  let q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(pageSize));
  if (category && category !== 'all') {
    q = query(collection(db, 'articles'), where('category', '==', category), orderBy('publishedAt', 'desc'), limit(pageSize));
  }
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
  const ref = doc(db, 'articles', articleId);
  await updateDoc(ref, { views: increment(1) });
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

export const getBookmarks = async (userId) => {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.data()?.bookmarks || [];
};

export const getVideoFeeds = async (category = null, count = 20) => {
  let q = query(collection(db, 'videos'), orderBy('fetchedAt', 'desc'), limit(count));
  if (category) {
    q = query(collection(db, 'videos'), where('category', '==', category), orderBy('fetchedAt', 'desc'), limit(count));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};
