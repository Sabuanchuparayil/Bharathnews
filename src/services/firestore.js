'use client';

import { getDbAsync, firestoreOps } from '@/lib/firebase-client';

const emptyPage = { articles: [], lastDoc: null, hasMore: false };

function articleLanguage(article) {
  return article?.language || 'en';
}

function matchesLanguage(article, language) {
  if (!language || language === 'all') return true;
  return articleLanguage(article) === language;
}

function filterByLanguage(articles, language) {
  if (!language || language === 'all') return articles;
  return articles.filter(a => matchesLanguage(a, language));
}

export const getArticles = async (category = null, lastDoc = null, pageSize = 20, language = null) => {
  const { articles } = await getArticlesPage(category, lastDoc, pageSize, language);
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
  if (filters.length === 0) {
    q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(pageSize));
  } else {
    q = query(collection(db, 'articles'), ...filters, orderBy('publishedAt', 'desc'), limit(pageSize));
  }
  if (lastDoc) {
    if (filters.length === 0) {
      q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else {
      q = query(collection(db, 'articles'), ...filters, orderBy('publishedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    }
  }
  const snapshot = await getDocs(q);
  const allArticles = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => !a.editorialStatus || a.editorialStatus === 'published');

  const seenSlugs = new Set();
  const articles = filterByLanguage(allArticles, language).filter(a => {
    if (!a.slug || seenSlugs.has(a.slug)) return false;
    seenSlugs.add(a.slug);
    return true;
  });

  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
  return { articles, lastDoc: lastVisible, hasMore: snapshot.docs.length === pageSize };
};

/** Paginate until enough unique-by-slug articles are collected (duplicate-heavy datasets). */
export const fetchUniqueArticles = async (category = null, minCount = 12, startAfterDoc = null, language = null) => {
  const seenSlugs = new Set();
  const matched = [];
  const unfiltered = [];
  let lastDoc = startAfterDoc;
  let hasMore = true;
  let pagesScanned = 0;
  const maxPages = language ? 10 : 4;

  while (
    (matched.length < minCount || (language && unfiltered.length < minCount)) &&
    hasMore &&
    pagesScanned < maxPages
  ) {
    const page = await getArticlesPage(category, lastDoc, 24, null);
    pagesScanned++;
    for (const article of page.articles) {
      if (!article?.slug || seenSlugs.has(article.slug)) continue;
      seenSlugs.add(article.slug);
      unfiltered.push(article);
      if (matchesLanguage(article, language)) {
        matched.push(article);
      }
      if (matched.length >= minCount) break;
    }
    lastDoc = page.lastDoc;
    hasMore = page.hasMore;
    if (!page.articles.length) break;
  }

  const articles = matched.length > 0
    ? matched.slice(0, minCount)
    : unfiltered.slice(0, minCount);

  return { articles, lastDoc, hasMore };
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

export const getTrendingArticles = async (count = 5, language = null) => {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, orderBy, limit, getDocs } = await firestoreOps();
  const fetchLimit = language ? count + 120 : count + 30;
  const q = query(collection(db, 'articles'), orderBy('views', 'desc'), limit(fetchLimit));
  const snapshot = await getDocs(q);
  const seen = new Set();
  const articles = [];
  for (const d of snapshot.docs) {
    const data = { id: d.id, ...d.data() };
    if (!matchesLanguage(data, language)) continue;
    if (!data.slug || seen.has(data.slug)) continue;
    seen.add(data.slug);
    articles.push(data);
    if (articles.length >= count) break;
  }

  if (articles.length === 0 && language) {
    return getTrendingArticles(count, null);
  }

  return articles;
};

export const getArticlesByInterests = async (interests, count = 10, language = null) => {
  const topCategories = Object.entries(interests.categories || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  if (topCategories.length === 0) return getTrendingArticles(count, language);

  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, where, orderBy, limit, getDocs } = await firestoreOps();
  const q = query(
    collection(db, 'articles'),
    where('category', 'in', topCategories),
    orderBy('score', 'desc'),
    limit(count + 20)
  );
  const snapshot = await getDocs(q);
  const seen = new Set();
  const collect = (lang) => snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => {
      if (!matchesLanguage(a, lang)) return false;
      if (!a.slug || seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    })
    .slice(0, count);

  const filtered = collect(language);
  if (filtered.length === 0 && language) {
    seen.clear();
    return collect(null);
  }
  return filtered;
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
  if (!normalized || normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Invalid email address');
  }
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

export const searchArticles = async (searchTerm, pageSize = 30, language = null) => {
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
  const seenIds = new Set();
  const seenSlugs = new Set();
  const articles = [];

  for (const snapshot of results) {
    for (const d of snapshot.docs) {
      if (seenIds.has(d.id)) continue;
      seenIds.add(d.id);
      const data = { id: d.id, ...d.data() };
      if (data.slug && seenSlugs.has(data.slug)) continue;
      const matchesTerm =
        data.title?.toLowerCase().includes(term) ||
        data.summary?.toLowerCase().includes(term) ||
        data.category?.toLowerCase().includes(term) ||
        data.author?.toLowerCase().includes(term);
      if (matchesTerm) {
        if (data.slug) seenSlugs.add(data.slug);
        articles.push(data);
      }
    }
  }

  const filtered = filterByLanguage(articles, language);
  if (filtered.length === 0 && language) {
    return articles.slice(0, pageSize);
  }

  return filtered.slice(0, pageSize);
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

export const getVideoFeeds = async (category = null, count = 20, language = null) => {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, where, orderBy, limit, getDocs } = await firestoreOps();
  const filters = [];
  if (category) filters.push(where('category', '==', category));
  if (language && language !== 'all') filters.push(where('language', '==', language));

  let q;
  if (filters.length === 0) {
    q = query(collection(db, 'videos'), orderBy('fetchedAt', 'desc'), limit(count));
  } else if (filters.length === 1) {
    q = query(collection(db, 'videos'), filters[0], orderBy('fetchedAt', 'desc'), limit(count));
  } else {
    q = query(collection(db, 'videos'), ...filters, orderBy('fetchedAt', 'desc'), limit(count));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};
