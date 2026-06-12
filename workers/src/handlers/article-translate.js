import { callAI, parseJsonFromAI } from '../lib/llama.js';

const LANG_NAMES = {
  en: 'English',
  ml: 'Malayalam',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
};

const ALLOWED = new Set(Object.keys(LANG_NAMES));

export async function translateArticleContent(env, { title, summary, fullContent, targetLang, sourceLang = 'en' }) {
  if (!ALLOWED.has(targetLang)) {
    throw new Error(`Unsupported language: ${targetLang}`);
  }
  const targetName = LANG_NAMES[targetLang];
  const sourceName = LANG_NAMES[sourceLang] || sourceLang;

  const prompt = `Translate this news article from ${sourceName} to ${targetName}.
Preserve facts, names, and places accurately. Professional news tone. Do not add commentary.

Respond ONLY with valid JSON (no markdown):
{
  "title": "translated title",
  "summary": "translated summary",
  "fullContent": "translated full article body"
}

Title: ${title || ''}
Summary: ${summary || ''}
Body:
${(fullContent || '').slice(0, 6000)}`;

  const text = await callAI(env, prompt, 4096);
  const parsed = parseJsonFromAI(text);
  return {
    title: parsed.title || title,
    summary: parsed.summary || summary,
    fullContent: parsed.fullContent || fullContent,
  };
}
