'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';
import { rowToApp, rowsToApp } from '@/lib/db-mapper';
import { getLegacyCategoriesForSection } from '@/config/category-taxonomy';
import { filterBySubcategory } from '@/utils/subcategoryMatcher';
import { articleFreshnessMs } from '@/utils/articleDates';

const emptyPage = { articles: [], lastDoc: null, hasMore: false };

function getClient() {
  return getSupabaseBrowser();
}

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

function applyLanguageFilter(query, language) {
  if (language && language !== 'all') {
    return query.eq('language', language);
  }
  return query;
}

export const getArticles = async (category = null, lastDoc = null, pageSize = 20, language = null) => {
  const { articles } = await getArticlesPage(category, lastDoc, pageSize, language);
  return articles;
};

export const getArticlesPage = async (category = null, lastDoc = null, pageSize = 20, language = null) => {
  const supabase = getClient();
  if (!supabase) return emptyPage;

  if (category === 'breaking') {
    return getBreakingArticlesPage(lastDoc, pageSize, language);
  }

  let query = supabase
    .from('articles')
    .select('*')
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('created_at', { ascending: false })
    .limit(pageSize);

  query = applyLanguageFilter(query, language);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (lastDoc?._offset) {
    query = query.range(lastDoc._offset, lastDoc._offset + pageSize - 1);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getArticlesPage:', error.message);
    return emptyPage;
  }

  const allArticles = rowsToApp(data || []);
  const seenSlugs = new Set();
  const articles = filterByLanguage(allArticles, language).filter(a => {
    if (!a.slug || seenSlugs.has(a.slug)) return false;
    seenSlugs.add(a.slug);
    return true;
  });

  const offset = (lastDoc?._offset || 0) + (data?.length || 0);
  return {
    articles,
    lastDoc: data?.length === pageSize ? { _offset: offset } : null,
    hasMore: (data?.length || 0) === pageSize,
  };
};

const BREAKING_WINDOW_HOURS = 72;

async function getBreakingArticlesPage(lastDoc = null, pageSize = 20, language = null) {
  const supabase = getClient();
  if (!supabase) return emptyPage;

  const cutoff = new Date(Date.now() - BREAKING_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from('articles')
    .select('*')
    .gte('created_at', cutoff)
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('created_at', { ascending: false })
    .limit(pageSize);

  query = applyLanguageFilter(query, language);

  if (lastDoc?._offset != null) {
    query = query.range(lastDoc._offset, lastDoc._offset + pageSize - 1);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getBreakingArticlesPage:', error.message);
    return emptyPage;
  }

  const allArticles = rowsToApp(data || []);
  const seenSlugs = new Set();
  let articles = filterByLanguage(allArticles, language).filter(a => {
    if (!a.slug || seenSlugs.has(a.slug)) return false;
    seenSlugs.add(a.slug);
    return true;
  });

  if (language && articles.length === 0 && allArticles.length > 0) {
    articles = allArticles.filter(a => a?.slug);
  }

  const offset = (lastDoc?._offset || 0) + (data?.length || 0);
  return {
    articles: articles.slice(0, pageSize),
    lastDoc: data?.length === pageSize ? { _offset: offset } : null,
    hasMore: (data?.length || 0) === pageSize,
  };
}

function articleRecency(a) {
  return Math.floor(articleFreshnessMs(a) / 1000);
}

export const fetchUniqueArticles = async (category = null, minCount = 12, startAfterDoc = null, language = null) => {
  const seenSlugs = new Set();
  const matched = [];
  let lastDoc = startAfterDoc;
  let hasMore = true;
  let pagesScanned = 0;
  const maxPages = 4;

  while (matched.length < minCount && hasMore && pagesScanned < maxPages) {
    const page = await getArticlesPage(category, lastDoc, Math.max(minCount, 24), language);
    pagesScanned++;
    for (const article of page.articles) {
      if (!article?.slug || seenSlugs.has(article.slug)) continue;
      seenSlugs.add(article.slug);
      matched.push(article);
      if (matched.length >= minCount) break;
    }
    lastDoc = page.lastDoc;
    hasMore = page.hasMore;
    if (!page.articles.length) break;
  }

  return { articles: matched.slice(0, minCount), lastDoc, hasMore };
};

export const getArticlesPageForSection = async (
  sectionId,
  subcategoryId = 'all',
  lastDoc = null,
  pageSize = 20,
  language = null,
) => {
  const supabase = getClient();
  if (!supabase) return emptyPage;

  if (sectionId === 'top-stories') {
    if (subcategoryId === 'most-read') {
      const articles = await getMostReadArticles(pageSize, language);
      return { articles, lastDoc: null, hasMore: false };
    }
    if (subcategoryId === 'breaking') {
      return getBreakingArticlesPage(lastDoc, pageSize, language);
    }

    const fetchSize = subcategoryId && subcategoryId !== 'all' ? pageSize * 4 : pageSize;
    let query = supabase
      .from('articles')
      .select('*')
      .or('editorial_status.eq.published,editorial_status.is.null')
      .order('created_at', { ascending: false })
      .limit(fetchSize);

    query = applyLanguageFilter(query, language);

    if (lastDoc?._offset) {
      query = query.range(lastDoc._offset, lastDoc._offset + fetchSize - 1);
    }

    const { data, error } = await query;
    if (error) {
      console.error('getArticlesPageForSection top-stories:', error.message);
      return emptyPage;
    }

    const allArticles = rowsToApp(data || []);
    const seenSlugs = new Set();
    let articles = filterByLanguage(allArticles, language).filter(a => {
      if (!a.slug || seenSlugs.has(a.slug)) return false;
      seenSlugs.add(a.slug);
      return true;
    });

    articles = filterBySubcategory(articles, sectionId, subcategoryId).slice(0, pageSize);
    const offset = (lastDoc?._offset || 0) + (data?.length || 0);
    return {
      articles,
      lastDoc: (data?.length || 0) >= fetchSize ? { _offset: offset } : null,
      hasMore: (data?.length || 0) >= fetchSize,
    };
  }

  const legacyCategories = getLegacyCategoriesForSection(sectionId, subcategoryId);
  if (!legacyCategories?.length) {
    return getArticlesPage(null, lastDoc, pageSize, language);
  }

  const fetchSize = subcategoryId && subcategoryId !== 'all' ? pageSize * 3 : pageSize;

  let query = supabase
    .from('articles')
    .select('*')
    .in('category', legacyCategories)
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('created_at', { ascending: false })
    .limit(fetchSize);

  query = applyLanguageFilter(query, language);

  if (lastDoc?._offset) {
    query = query.range(lastDoc._offset, lastDoc._offset + fetchSize - 1);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getArticlesPageForSection:', error.message);
    return emptyPage;
  }

  const allArticles = rowsToApp(data || []);
  const seenSlugs = new Set();
  let articles = filterByLanguage(allArticles, language).filter(a => {
    if (!a.slug || seenSlugs.has(a.slug)) return false;
    seenSlugs.add(a.slug);
    return true;
  });

  articles = filterBySubcategory(articles, sectionId, subcategoryId).slice(0, pageSize);

  const offset = (lastDoc?._offset || 0) + (data?.length || 0);
  return {
    articles,
    lastDoc: (data?.length || 0) >= fetchSize ? { _offset: offset } : null,
    hasMore: (data?.length || 0) >= fetchSize,
  };
};

export const fetchUniqueArticlesForSection = async (
  sectionId,
  subcategoryId = 'all',
  minCount = 12,
  startAfterDoc = null,
  language = null,
) => {
  const seenSlugs = new Set();
  const matched = [];
  let lastDoc = startAfterDoc;
  let hasMore = true;
  let pagesScanned = 0;
  const maxPages = 4;

  while (matched.length < minCount && hasMore && pagesScanned < maxPages) {
    const page = await getArticlesPageForSection(sectionId, subcategoryId, lastDoc, Math.max(minCount, 24), language);
    pagesScanned++;
    for (const article of page.articles) {
      if (!article?.slug || seenSlugs.has(article.slug)) continue;
      seenSlugs.add(article.slug);
      matched.push(article);
      if (matched.length >= minCount) break;
    }
    lastDoc = page.lastDoc;
    hasMore = page.hasMore;
    if (!page.articles.length) break;
  }

  return { articles: matched.slice(0, minCount), lastDoc, hasMore };
};

export const getMostReadArticles = async (count = 5, language = null, hours = 24) => {
  const supabase = getClient();
  if (!supabase) return [];

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from('articles')
    .select('*')
    .gte('created_at', cutoff)
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('views', { ascending: false })
    .limit(count + 10);

  query = applyLanguageFilter(query, language);

  const { data } = await query;

  const seen = new Set();
  return rowsToApp(data || []).filter(a => {
    if (!a.slug || seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  }).slice(0, count);
};

export const getSectionPreviewArticles = async (sectionId, count = 3, language = null) => {
  const { articles } = await fetchUniqueArticlesForSection(sectionId, 'all', count, null, language);
  return articles;
};

export const getArticleBySlug = async (slug) => {
  const supabase = getClient();
  if (!supabase) return null;
  const decoded = decodeURIComponent(slug || '');
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', decoded)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToApp(data);
};

export const getTrendingArticles = async (count = 5, language = null) => {
  const supabase = getClient();
  if (!supabase) return [];

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const fetchLimit = count + 20;

  let recentQuery = supabase
    .from('articles')
    .select('*')
    .gte('created_at', cutoff)
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('created_at', { ascending: false })
    .limit(fetchLimit);

  recentQuery = applyLanguageFilter(recentQuery, language);

  const { data: recent } = await recentQuery;

  const seen = new Set();
  let candidates = rowsToApp(recent || []).filter(a => {
    if (!matchesLanguage(a, language)) return false;
    if (!a.slug || seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });

  candidates.sort((a, b) => articleRecency(b) - articleRecency(a));
  if (candidates.length >= count) return candidates.slice(0, count);

  const widerCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let widerQuery = supabase
    .from('articles')
    .select('*')
    .gte('created_at', widerCutoff)
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('created_at', { ascending: false })
    .limit(fetchLimit);

  widerQuery = applyLanguageFilter(widerQuery, language);

  const { data: wider } = await widerQuery;

  for (const row of wider || []) {
    const a = rowToApp(row);
    if (!matchesLanguage(a, language)) continue;
    if (!a.slug || seen.has(a.slug)) continue;
    seen.add(a.slug);
    candidates.push(a);
  }
  candidates.sort((a, b) => articleRecency(b) - articleRecency(a));

  if (candidates.length > 0) return candidates.slice(0, count);
  if (language) return getTrendingArticles(count, null);
  return [];
};

export const getArticlesByInterests = async (interests, count = 10, language = null) => {
  const topCategories = Object.entries(interests.categories || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  if (topCategories.length === 0) return getTrendingArticles(count, language);

  const supabase = getClient();
  if (!supabase) return [];

  let query = supabase
    .from('articles')
    .select('*')
    .in('category', topCategories)
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('created_at', { ascending: false })
    .limit(count + 20);

  if (language && language !== 'all') {
    query = query.eq('language', language);
  }

  const { data } = await query;

  const seen = new Set();
  const collect = (lang) => rowsToApp(data || []).filter(a => {
    if (!matchesLanguage(a, lang)) return false;
    if (!a.slug || seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  }).slice(0, count);

  const filtered = collect(language);
  if (filtered.length === 0 && language) {
    seen.clear();
    return collect(null);
  }
  return filtered;
};


export const addBookmark = async (userId, articleId) => {
  const supabase = getClient();
  if (!supabase) return;
  const { data: user } = await supabase.from('users').select('bookmarks').eq('id', userId).single();
  const bookmarks = [...(user?.bookmarks || []), articleId];
  await supabase.from('users').update({ bookmarks }).eq('id', userId);
};

export const removeBookmark = async (userId, articleId) => {
  const supabase = getClient();
  if (!supabase) return;
  const { data: user } = await supabase.from('users').select('bookmarks').eq('id', userId).single();
  const bookmarks = (user?.bookmarks || []).filter(id => id !== articleId);
  await supabase.from('users').update({ bookmarks }).eq('id', userId);
};

export const toggleBookmark = async (userId, articleId, isBookmarked) => {
  if (isBookmarked) await removeBookmark(userId, articleId);
  else await addBookmark(userId, articleId);
};

export const getBookmarks = async (userId) => {
  const supabase = getClient();
  if (!supabase) return [];
  const { data } = await supabase.from('users').select('bookmarks').eq('id', userId).single();
  return data?.bookmarks || [];
};

export const toggleLike = async (userId, articleId, isLiked) => {
  const supabase = getClient();
  if (!supabase) return;

  const { data: user } = await supabase.from('users').select('likes').eq('id', userId).single();
  const likes = isLiked
    ? (user?.likes || []).filter(id => id !== articleId)
    : [...(user?.likes || []), articleId];
  await supabase.from('users').update({ likes }).eq('id', userId);

  await supabase.rpc('increment_article_likes', {
    article_id: articleId,
    delta: isLiked ? -1 : 1,
  });
};

export const subscribeNewsletter = async (email) => {
  const supabase = getClient();
  if (!supabase) throw new Error('Database unavailable');
  const normalized = email.toLowerCase().trim();
  if (!normalized || normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Invalid email address');
  }

  const { error } = await supabase.from('subscribers').insert({ email: normalized, source: 'website' });
  if (error?.code === '23505') throw new Error('ALREADY_SUBSCRIBED');
  if (error) throw error;
};

export const getSubscriberCount = async () => {
  const supabase = getClient();
  if (!supabase) return 0;
  const { count } = await supabase.from('subscribers').select('*', { count: 'exact', head: true });
  return count || 0;
};

export const searchArticles = async (searchTerm, pageSize = 30, language = null) => {
  const supabase = getClient();
  if (!supabase) return [];
  const term = searchTerm.toLowerCase().trim();
  if (!term) return [];

  const { data } = await supabase
    .from('articles')
    .select('*')
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('published_at', { ascending: false })
    .limit(200);

  const seenSlugs = new Set();
  const articles = rowsToApp(data || []).filter(a => {
    if (a.slug && seenSlugs.has(a.slug)) return false;
    const matchesTerm =
      a.title?.toLowerCase().includes(term) ||
      a.summary?.toLowerCase().includes(term) ||
      a.category?.toLowerCase().includes(term) ||
      a.author?.toLowerCase().includes(term) ||
      a.category?.toLowerCase() === term;
    if (matchesTerm && a.slug) seenSlugs.add(a.slug);
    return matchesTerm;
  });

  const filtered = filterByLanguage(articles, language);
  if (filtered.length === 0 && language) return articles.slice(0, pageSize);
  return filtered.slice(0, pageSize);
};

export const getArticlesByIds = async (articleIds) => {
  const supabase = getClient();
  if (!supabase || !articleIds.length) return [];
  const { data } = await supabase.from('articles').select('*').in('id', articleIds);
  return rowsToApp(data || []);
};

export const getVideoFeeds = async (category = null, count = 100, language = null) => {
  const supabase = getClient();
  if (!supabase) return [];

  let query = supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('fetched_at', { ascending: false })
    .limit(count);
  if (category) query = query.eq('category', category);
  if (language && language !== 'all') query = query.eq('language', language);

  const { data } = await query;
  return rowsToApp(data || []);
};
