import { SUPPORTED_LANGUAGES } from '@/config/languages.config';

/** Languages readers can switch to on an article page (excludes "all"). */
export const READABLE_LANGS = SUPPORTED_LANGUAGES.filter(l => l.code !== 'all');

export function getArticleSourceLang(article) {
  return article?.language || 'en';
}

export function getStoredTranslation(article, langCode) {
  if (!article?.translations || !langCode) return null;
  const tr = article.translations[langCode];
  if (!tr || typeof tr !== 'object') return null;
  if (!tr.title && !tr.fullContent && !tr.summary) return null;
  return tr;
}

/**
 * Resolve title/summary/body for display. Returns null if target lang needs on-demand fetch.
 */
export function resolveArticleDisplay(article, readLang) {
  const sourceLang = getArticleSourceLang(article);
  const target = readLang === 'all' ? sourceLang : readLang;

  if (!target || target === sourceLang) {
    return {
      title: article.title,
      summary: article.summary,
      fullContent: article.fullContent,
      lang: sourceLang,
      isTranslation: false,
      machineAssisted: false,
    };
  }

  const stored = getStoredTranslation(article, target);
  if (stored) {
    return {
      title: stored.title || article.title,
      summary: stored.summary || article.summary,
      fullContent: stored.fullContent || article.fullContent,
      lang: target,
      isTranslation: true,
      machineAssisted: !!stored.machineAssisted,
    };
  }

  return null;
}

export function listAvailableReadLangs(article) {
  const sourceLang = getArticleSourceLang(article);
  const codes = new Set([sourceLang]);
  if (article?.translations && typeof article.translations === 'object') {
    for (const [code, tr] of Object.entries(article.translations)) {
      if (tr?.title || tr?.fullContent || tr?.summary) codes.add(code);
    }
  }
  return READABLE_LANGS.filter(l => codes.has(l.code));
}

export function listOnDemandLangs(article) {
  const available = new Set(listAvailableReadLangs(article).map(l => l.code));
  const sourceLang = getArticleSourceLang(article);
  return READABLE_LANGS.filter(l => l.code !== sourceLang && !available.has(l.code));
}
