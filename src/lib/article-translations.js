import { READABLE_LANGUAGE_CATALOG, SELECTABLE_LANGUAGES } from '@/config/languages.config';
import { decodeHtmlEntities } from '@/utils/formatters';

/** Labels for a story's source language and any stored translation. */
export const READABLE_LANGS = READABLE_LANGUAGE_CATALOG;

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
      title: decodeHtmlEntities(article.title),
      summary: decodeHtmlEntities(article.summary),
      fullContent: decodeHtmlEntities(article.fullContent),
      lang: sourceLang,
      isTranslation: false,
      machineAssisted: false,
    };
  }

  const stored = getStoredTranslation(article, target);
  if (stored) {
    return {
      title: decodeHtmlEntities(stored.title || article.title),
      summary: decodeHtmlEntities(stored.summary || article.summary),
      fullContent: decodeHtmlEntities(stored.fullContent || article.fullContent),
      lang: target,
      isTranslation: true,
      // Newsroom translations are checked by the editorial board before publishing.
      machineAssisted: !!stored.machineAssisted && stored.provider !== 'claude-cowork',
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
  return SELECTABLE_LANGUAGES.filter(l => l.code !== sourceLang && !available.has(l.code));
}
