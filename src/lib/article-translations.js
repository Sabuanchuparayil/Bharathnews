import { READABLE_LANGUAGE_CATALOG, SELECTABLE_LANGUAGES } from '@/config/languages.config';
import { decodeHtmlEntities } from '@/utils/formatters';

/** Labels for a story's source language and any stored translation. */
export const READABLE_LANGS = READABLE_LANGUAGE_CATALOG;

export function getArticleSourceLang(article) {
  return article?.language || 'en';
}

function isCompleteStoredTranslation(tr) {
  if (!tr || typeof tr !== 'object') return false;
  return String(tr.title || '').trim().length >= 4 && String(tr.fullContent || '').trim().length >= 40;
}

export function getStoredTranslation(article, langCode) {
  if (!article?.translations || !langCode) return null;
  const tr = article.translations[langCode];
  if (!isCompleteStoredTranslation(tr)) return null;
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
      title: decodeHtmlEntities(stored.title),
      summary: decodeHtmlEntities(stored.summary || ''),
      fullContent: decodeHtmlEntities(stored.fullContent),
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
      if (isCompleteStoredTranslation(tr)) codes.add(code);
    }
  }
  return READABLE_LANGS.filter(l => codes.has(l.code));
}

export function listOnDemandLangs(article) {
  const available = new Set(listAvailableReadLangs(article).map(l => l.code));
  const sourceLang = getArticleSourceLang(article);
  return SELECTABLE_LANGUAGES.filter(l => l.code !== sourceLang && !available.has(l.code));
}
