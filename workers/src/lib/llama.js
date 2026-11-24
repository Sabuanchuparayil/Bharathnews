export async function callAI(env, prompt, maxTokens = 2048) {
  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  if (typeof response === 'string') return response;
  if (typeof response?.response === 'string') return response.response;
  if (typeof response?.result === 'string') return response.result;

  const target = response?.response ?? response?.result ?? response;
  return typeof target === 'object' ? JSON.stringify(target) : String(target || '');
}

export function parseJsonFromAI(text) {
  if (typeof text === 'object' && text !== null) return text;
  const cleaned = String(text).replace(/```json\n?|\n?```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

const LANG_NAMES = { en: 'English', ml: 'Malayalam' };

function publicationTargets(targetLangs) {
  const codes = [...new Set(
    (Array.isArray(targetLangs) && targetLangs.length ? targetLangs : ['ml'])
      .map(code => String(code || '').trim().toLowerCase())
      .filter(code => code === 'en' || code === 'ml'),
  )];
  if (!codes.includes('ml')) codes.push('ml');
  return codes;
}

export async function generateMultilingualArticle(env, { title, description, source, category, topics, targetLangs = ['ml'] }) {
  const languages = publicationTargets(targetLangs);
  const langList = languages.map(code => LANG_NAMES[code]).join(', ');
  const translationTemplate = languages
    .reduce((o, l) => { o[l] = { title: '', summary: '', fullContent: '' }; return o; }, {});

  const prompt = `You are a news editor for The Bharath News (India-GCC focused).
Write an ORIGINAL 200-word English article from this headline and summary.
Add context for Indian expats in GCC. Professional tone. Do NOT copy source phrases.
Also translate title, summary, and full article into: ${langList}.

Headline: ${title}
Summary: ${description}
Source: ${source}
Category: ${category}
Topics: ${(topics || []).join(', ')}

Respond ONLY with valid JSON (no markdown):
{
  "title": "English title (may refine original)",
  "summary": "2 sentence English summary",
  "fullContent": "200-word English article",
  "topics": ["topic1","topic2","topic3"],
  "score": 7,
  "translations": ${JSON.stringify(translationTemplate)}
}`;

  const text = await callAI(env, prompt, 4096);
  return parseJsonFromAI(text);
}
