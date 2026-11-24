import { createHash } from 'node:crypto';
import { decodeHtmlEntities } from '../utils/formatters';

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

/** A stored English draft still matches this Malayalam story. */
export function englishDraftIsCurrent(version, title, fullContent) {
  if (!isComplete(version) || !version.sourceHash) return false;
  return version.sourceHash === sourceHash(title, fullContent);
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

async function translateWithMemory(text) {
  const chunks = textChunks(text);
  if (!chunks.length) return '';
  const translated = [];
  for (const chunk of chunks) {
    const response = await fetch('https://api.mymemory.translated.net/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ q: chunk, langpair: 'ml|en' }),
    });
    const data = await response.json().catch(() => ({}));
    const value = decodeHtmlEntities(String(data.responseData?.translatedText || '')).trim();
    if (!response.ok || data.quotaFinished || !value || /MYMEMORY WARNING/i.test(value)) return null;
    translated.push(value);
  }
  return translated.join('\n\n');
}

async function translateWithWorker({ title, summary, fullContent }) {
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
        targetLang: 'en',
        sourceLang: 'ml',
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

async function translateMalayalamToEnglish({ title, summary, fullContent }) {
  const google = await translateWithWorker({ title, summary, fullContent });
  const draft = google || await (async () => {
    const translatedTitle = await translateWithMemory(title);
    const translatedSummary = summary ? await translateWithMemory(summary) : '';
    const translatedBody = await translateWithMemory(fullContent);
    if (!translatedTitle || !translatedBody) return null;
    return {
      title: translatedTitle,
      summary: translatedSummary || '',
      fullContent: translatedBody,
      provider: 'mymemory',
    };
  })();
  if (!draft) return null;
  const translatedTitle = draft.title.trim();
  const translatedBody = draft.fullContent.trim();
  if (translatedTitle.length < 4 || translatedBody.length < 40) return null;
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

/**
 * Malayalam desk stories get an English draft for review.
 * A story marked skip English is left unchanged. A complete hand-written
 * English version is kept until the Malayalam text changes.
 */
export async function withAutomaticEnglish(article) {
  const translations = { ...(article.translations || {}) };
  const language = String(article.language || '').trim().toLowerCase();
  if (article.skipEnglish === true || language !== 'ml') return translations;
  const current = translations.en;
  const hash = sourceHash(article.title, article.fullContent);
  if (isComplete(current) && !current.sourceHash) {
    translations.en = { ...current, sourceHash: hash };
    return translations;
  }
  if (englishDraftIsCurrent(current, article.title, article.fullContent)) return translations;
  const draft = await translateMalayalamToEnglish({
    title: article.title,
    summary: article.summary,
    fullContent: article.fullContent,
  });
  if (!draft) return translations;
  translations.en = draft;
  return translations;
}
