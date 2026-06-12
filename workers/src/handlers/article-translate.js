import { translateArticleFields } from '../lib/google-translate.js';

const ALLOWED = new Set(['en', 'ml', 'hi', 'ta', 'te', 'kn', 'bn']);

export async function translateArticleContent(env, { title, summary, fullContent, targetLang, sourceLang = 'en' }) {
  if (!ALLOWED.has(targetLang)) {
    throw new Error(`Unsupported language: ${targetLang}`);
  }
  if (!env.GOOGLE_TRANSLATE_API_KEY && !env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('Translation not configured');
  }

  return translateArticleFields(env, {
    title,
    summary,
    fullContent,
    sourceLang: sourceLang || 'en',
    targetLang,
  });
}
