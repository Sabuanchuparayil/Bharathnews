import { SUBCATEGORIES, LEGACY_TO_SUBCATEGORY } from '../config/category-taxonomy.js';

function textBlob(article) {
  const parts = [
    article.title,
    article.summary,
    ...(article.topics || []),
    article.source,
  ].filter(Boolean);
  return parts.join(' ').toLowerCase();
}

function matchesKeywords(text, keywords = []) {
  if (!keywords.length) return false;
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

/**
 * Determine if an article belongs to a subcategory.
 * Uses DB subcategory column when present, then legacy category mapping, then keyword heuristics.
 */
export function articleMatchesSubcategory(article, sectionId, subcategoryId) {
  if (!subcategoryId || subcategoryId === 'all') return true;

  if (article.subcategory === subcategoryId) return true;

  const defaultSub = LEGACY_TO_SUBCATEGORY[article.category];
  if (defaultSub === subcategoryId) {
    const subs = SUBCATEGORIES[sectionId] || [];
    const sub = subs.find(s => s.id === subcategoryId);
    if (!sub?.keywords?.length) return true;
  }

  const subs = SUBCATEGORIES[sectionId] || [];
  const sub = subs.find(s => s.id === subcategoryId);
  if (!sub) return true;

  if (sub.legacyCategories?.length && !sub.legacyCategories.includes(article.category)) {
    if (defaultSub !== subcategoryId) return false;
  }

  if (sub.keywords?.length) {
    const text = textBlob(article);
    if (matchesKeywords(text, sub.keywords)) return true;
    if (defaultSub === subcategoryId) return true;
    return false;
  }

  return defaultSub === subcategoryId;
}

export function filterBySubcategory(articles, sectionId, subcategoryId) {
  if (!subcategoryId || subcategoryId === 'all') return articles;
  return articles.filter(a => articleMatchesSubcategory(a, sectionId, subcategoryId));
}

/** Infer subcategory tag for an article (used by worker + client fallback) */
export function inferSubcategory(article) {
  const { category, title = '', summary = '', source = '', topics = [] } = article;
  const text = [title, summary, source, ...topics].join(' ').toLowerCase();

  const sectionId = category === 'india' || category === 'gcc' || category === 'world'
    ? 'world'
    : category === 'business' || category === 'jobs' || category === 'realestate'
      ? 'money'
      : category === 'technology'
        ? 'tech'
        : category === 'sports'
          ? 'sports'
          : ['health', 'education', 'entertainment', 'lifestyle', 'opinion'].includes(category)
            ? 'life'
            : null;

  if (!sectionId) return LEGACY_TO_SUBCATEGORY[category] || null;

  const subs = SUBCATEGORIES[sectionId] || [];
  for (const sub of subs) {
    if (sub.id === 'all') continue;
    if (sub.legacyCategories?.includes(category) && !sub.keywords?.length) {
      return sub.id;
    }
    if (sub.keywords?.length && matchesKeywords(text, sub.keywords)) {
      return sub.id;
    }
  }

  return LEGACY_TO_SUBCATEGORY[category] || null;
}
