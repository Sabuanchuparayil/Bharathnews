import { translateArticleFields } from '../lib/google-translate.js';
import { detectPublicationLang } from '../../../shared/publication-lang.mjs';

const ALLOWED = new Set(['en', 'ml']);

export async function translateArticleContent(env, { title, summary, fullContent, targetLang, sourceLang = 'en' }) {
  const target = String(targetLang || '').trim().toLowerCase();
  const declared = String(sourceLang || 'en').trim().toLowerCase();
  const detected = detectPublicationLang(`${title || ''}\n${summary || ''}\n${fullContent || ''}`);
  const source = detected || declared;
  if (!ALLOWED.has(target) || !ALLOWED.has(source)) {
    throw new Error(`Unsupported language: ${targetLang}`);
  }
  if (source === target) {
    throw new Error('Source and target language are the same');
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
