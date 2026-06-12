const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export async function callClaude(env, prompt, { maxTokens = 1024, temperature = 0.2 } = {}) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const block = data.content?.find((b) => b.type === 'text');
  return block?.text || '';
}

export function parseJsonFromAI(text) {
  if (typeof text === 'object' && text !== null) return text;
  const cleaned = String(text).replace(/```json\n?|\n?```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object in AI response');
  return JSON.parse(match[0]);
}

export async function classifyArticle(env, { title, description, source, category, language }) {
  const prompt = `You are a news intelligence editor for The Bharath News (India-GCC focused platform for Indian expats).

Analyze this incoming news item and respond ONLY with valid JSON (no markdown):

Headline: ${title}
Summary: ${description}
Source: ${source}
Suggested category: ${category}
Source language hint: ${language || 'unknown'}

Valid categories: india, gcc, business, technology, sports, entertainment, health, education, jobs, realestate, lifestyle, opinion, world

JSON schema:
{
  "category": "best category slug",
  "topics": ["topic1","topic2","topic3"],
  "qualityScore": 7,
  "isJunk": false,
  "reasons": "brief reason",
  "detectedLanguage": "ISO 639-1 code (en, ml, ta, te, kn, bn, hi)",
  "dedupKey": "normalized 5-8 word key for deduplication",
  "relevanceToAudience": 8
}

Rules:
- isJunk=true ONLY for spam, clickbait with no substance, or auto-generated nonsense
- qualityScore 0-10: 5+ is publishable. Be generous — mainstream news sources produce quality content.
- relevanceToAudience 0-10: how interesting to Indians / Indian expats globally. Most India, GCC, world, business, tech, sports, health, education news scores 6+. Only niche local foreign news with zero India connection scores below 5.
- dedupKey: lowercase normalized key capturing the core news event (not the headline verbatim)
- Default to publishing. When in doubt, give qualityScore 7 and relevanceToAudience 7.
- If source language hint is ml/ta/te/kn/bn/hi, set detectedLanguage to that code unless the headline is clearly English.`;

  try {
    const text = await callClaude(env, prompt, { maxTokens: 512, temperature: 0.2 });
    return parseJsonFromAI(text);
  } catch (err) {
    console.error('Claude classify failed, using fallback:', err.message);
    return {
      category: category || 'india',
      topics: [category || 'india'],
      qualityScore: 7,
      isJunk: false,
      reasons: 'Claude unavailable - fallback classification',
      detectedLanguage: language || 'en',
      dedupKey: title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 6).join('-'),
      relevanceToAudience: 7,
    };
  }
}
