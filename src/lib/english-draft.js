import { createHash } from 'node:crypto';
import { decodeHtmlEntities } from '../utils/formatters';
import { detectPublicationLang, translationMatchesTarget } from '../../shared/publication-lang.mjs';

const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL || '').replace(/\/$/, '');

function sourceHash(title, fullContent) {
  return createHash('sha256')
    .update(`${String(title || '').trim()}\n${String(fullContent || '').trim()}`)
    .digest('hex')
    .slice(0, 16);
}

function isComplete(version) {
  return String(version?.title || '').trim().length >= 4
    && String(version?.fullContent || '').trim().length >= 40;
}

function textChunks(text) {
  const parts = String(text || '').split(/\n+/).map(part => part.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  const push = (value) => {
    const piece = String(value || '').trim();
    if (piece) chunks.push(piece);
  };
  for (const part of parts) {
    if (part.length > 400) {
      push(current);
      current = '';
      for (let index = 0; index < part.length; index += 400) push(part.slice(index, index + 400));
      continue;
    }
    const next = current ? `${current}\n${part}` : part;
    if (next.length > 400) {
      push(current);
      current = part;
    } else {
      current = next;
    }
  }
  push(current);
  return chunks;
}

async function translateMarked(text, translate) {
  const parts = String(text || '').split(/(\*\*[^*\n]+?\*\*)/g);
  let result = '';
  for (const part of parts) {
    if (!part) continue;
    const bold = part.match(/^\*\*([^*\n]+)\*\*$/);
    const source = bold ? bold[1] : part;
    if (!source.trim()) {
      result += part;
      continue;
    }
    const translated = await translate(source);
    if (!translated) return null;
    result += bold ? `**${translated}**` : translated;
  }
  return result;
}

function resolvedSourceLang(title, summary, fullContent, declared) {
  return detectPublicationLang(`${title || ''}\n${summary || ''}\n${fullContent || ''}`) || declared;
}

/** Language the story is actually written in. The stored tag is only a fallback. */
export function publicationLanguage({ language, title, summary, fullContent } = {}) {
  const tagged = String(language || '').trim().toLowerCase();
  return resolvedSourceLang(title, summary, fullContent, tagged);
}

async function translateWithMemory(text, langpair) {
  const chunks = textChunks(text);
  if (!chunks.length) return '';
  const translated = [];
  for (const chunk of chunks) {
    let response;
    try {
      response = await fetch('https://api.mymemory.translated.net/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ q: chunk, langpair }),
      });
    } catch {
      return null;
    }
    const data = await response.json().catch(() => ({}));
    const value = decodeHtmlEntities(String(data.responseData?.translatedText || '')).trim();
    if (!response.ok || data.quotaFinished || !value || /MYMEMORY WARNING/i.test(value)) return null;
    translated.push(value);
  }
  return translated.join('\n\n');
}

async function translateWithWorker({ title, summary, fullContent, sourceLang, targetLang }) {
  if (!WORKER_URL) return null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thebharathnews.com';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${WORKER_URL}/api/article-translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: siteUrl,
      },
      body: JSON.stringify({
        title: title || '',
        summary: summary || '',
        fullContent: String(fullContent || '').slice(0, 30000),
        targetLang,
        sourceLang,
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    const translation = data.translation || {};
    const translatedTitle = decodeHtmlEntities(String(translation.title || '')).trim();
    const translatedBody = decodeHtmlEntities(String(translation.fullContent || '')).trim();
    if (translatedTitle.length < 4 || translatedBody.length < 40) return null;
    return {
      title: translatedTitle,
      summary: decodeHtmlEntities(String(translation.summary || '')).trim(),
      fullContent: translatedBody,
      provider: 'google-nmt',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function acceptable(draft, targetLang) {
  if (!draft) return false;
  const translatedTitle = draft.title.trim();
  const translatedBody = draft.fullContent.trim();
  if (translatedTitle.length < 4 || translatedBody.length < 40) return false;
  return translationMatchesTarget(translatedTitle, translatedBody, targetLang);
}

async function translatePair({ title, summary, fullContent, sourceLang, targetLang }) {
  const source = resolvedSourceLang(title, summary, fullContent, sourceLang);
  if (source === targetLang) return null;
  const google = await translateWithWorker({ title, summary, fullContent, sourceLang: source, targetLang });
  const draft = (acceptable(google, targetLang) ? google : null) || await (async () => {
    const translate = (text) => translateWithMemory(text, `${source}|${targetLang}`);
    const translatedTitle = await translateMarked(title, translate);
    const translatedSummary = summary ? await translateMarked(summary, translate) : '';
    const translatedBody = await translateMarked(fullContent, translate);
    if (!translatedTitle || !translatedBody) return null;
    return {
      title: translatedTitle,
      summary: translatedSummary || '',
      fullContent: translatedBody,
      provider: 'mymemory',
    };
  })();
  if (!acceptable(draft, targetLang)) return null;
  const translatedTitle = draft.title.trim();
  const translatedBody = draft.fullContent.trim();
  return {
    title: translatedTitle.slice(0, 200),
    summary: draft.summary.trim().slice(0, 500),
    fullContent: translatedBody.slice(0, 50000),
    machineAssisted: true,
    provider: draft.provider,
    sourceHash: sourceHash(title, fullContent),
    updatedAt: new Date().toISOString(),
  };
}

async function fillPartner(article, { sourceLang, targetLang, skip }) {
  const translations = { ...(article.translations || {}) };
  if (skip) return translations;
  const current = translations[targetLang];
  const hash = sourceHash(article.title, article.fullContent);
  const machine = current?.provider === 'google-nmt' || current?.provider === 'mymemory';
  const matchesTarget = translationMatchesTarget(current?.title, current?.fullContent, targetLang);
  if (isComplete(current) && matchesTarget && !current.sourceHash && !machine) {
    translations[targetLang] = { ...current, sourceHash: hash };
    return translations;
  }
  if (isComplete(current) && matchesTarget && current.sourceHash === hash) return translations;
  const draft = await translatePair({
    title: article.title,
    summary: article.summary,
    fullContent: article.fullContent,
    sourceLang,
    targetLang,
  });
  if (!draft) {
    if (current && !matchesTarget) delete translations[targetLang];
    return translations;
  }
  translations[targetLang] = draft;
  return translations;
}

/**
 * The desk's other language is prepared for review.
 * Malayalam stories get English. English stories get Malayalam.
 * A waived language is left unchanged. A complete hand-written
 * version is kept until the source text changes.
 */
export async function withAutomaticPartner(article) {
  const language = publicationLanguage(article);
  if (language === 'ml') {
    return fillPartner(article, { sourceLang: 'ml', targetLang: 'en', skip: article.skipEnglish === true });
  }
  if (language === 'en') {
    return fillPartner(article, { sourceLang: 'en', targetLang: 'ml', skip: article.skipMalayalam === true });
  }
  return { ...(article.translations || {}) };
}
