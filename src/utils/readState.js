const STORAGE_KEY = 'tbn_read_articles';
const VISIT_KEY = 'tbn_last_visit';
const MAX_ENTRIES = 500;

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function getReadSlugs() {
  if (typeof window === 'undefined') return new Set();
  const data = safeParse(localStorage.getItem(STORAGE_KEY), []);
  return new Set(Array.isArray(data) ? data : []);
}

export function markArticleRead(slug) {
  if (!slug || typeof window === 'undefined') return;
  const slugs = [...getReadSlugs()];
  if (!slugs.includes(slug)) {
    slugs.unshift(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs.slice(0, MAX_ENTRIES)));
  }
}

export function isArticleRead(slug) {
  return getReadSlugs().has(slug);
}

export function getLastVisitTime() {
  if (typeof window === 'undefined') return null;
  const ts = localStorage.getItem(VISIT_KEY);
  return ts ? Number(ts) : null;
}

export function updateLastVisitTime() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VISIT_KEY, String(Date.now()));
}

export function estimateReadTime(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
