import { translateArticleFields } from '../lib/google-translate.js';

const ALLOWED = new Set(['en', 'ml']);

export async function translateArticleContent(env, { title, summary, fullContent, targetLang, sourceLang = 'en' }) {
  const target = String(targetLang || '').trim().toLowerCase();
  const source = String(sourceLang || 'en').trim().toLowerCase();
  if (!ALLOWED.has(target)) {
    throw new Error(`Unsupported language: ${targetLang}`);
  }
  if (!env.GOOGLE_TRANSLATE_API_KEY && !env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('Translation not configured');
  }

  return translateArticleFields(env, {
    title,
    summary,
    fullContent,
    sourceLang: source,
    targetLang: target,
  });
}
