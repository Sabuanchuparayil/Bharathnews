import { supabaseHeaders } from '../lib/supabase-rest.js';

const INDIA_GCC_BASE_KEYWORDS = [
  'India news today', 'breaking news India', 'GCC news', 'UAE news Indians',
  'Saudi Arabia news', 'Qatar news', 'NRI news Gulf', 'Indian diaspora',
  'Kerala news', 'Tamil Nadu news', 'Andhra Pradesh news', 'Karnataka news',
  'West Bengal news', 'Maharashtra news', 'Delhi news', 'UP news',
  'Dubai Indian community', 'Bahrain Indians', 'Kuwait Indians', 'Oman Indians',
];

const CATEGORY_KEYWORD_MAP = {
  india: ['Indian politics', 'Lok Sabha', 'Modi government', 'India Supreme Court', 'Indian elections', 'India economy'],
  gcc: ['UAE visa rules', 'Saudi Iqama', 'Gulf jobs Indians', 'UAE golden visa', 'NRI remittance', 'Indian schools Gulf'],
  business: ['Sensex today', 'Nifty live', 'Indian stocks', 'RBI policy', 'India GDP', 'startup funding India'],
  technology: ['India AI', 'Indian startups', 'ISRO', 'Digital India', '5G India', 'India semiconductors'],
  sports: ['cricket India', 'IPL', 'BCCI', 'India Olympics', 'ISL football', 'Pro Kabaddi'],
  entertainment: ['Bollywood', 'South Indian movies', 'OTT India', 'Indian web series', 'Tollywood', 'Mollywood'],
  health: ['India health', 'AIIMS', 'Ayurveda', 'India vaccination', 'yoga wellness'],
  education: ['UPSC', 'JEE NEET', 'CBSE results', 'India university', 'competitive exams India'],
  jobs: ['sarkari naukri', 'government jobs India', 'Gulf jobs', 'IT jobs India', 'bank exams'],
};

const AI_AGENT_DISCOVERY_KEYWORDS = [
  'what is happening in India', 'latest Indian news summary', 'India current affairs today',
  'news about Indians in Gulf', 'India news multilingual', 'Indian news in Malayalam',
  'India daily news brief', 'India news AI summary', 'Indian headlines today',
  'trending in India now', 'India news feed RSS', 'India regional news',
];

export async function handleSeoUpdate(env) {
  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const headers = supabaseHeaders(env);

  const recentRes = await fetch(
    `${base}/articles?or=(editorial_status.eq.published,editorial_status.is.null)&order=created_at.desc&limit=100&select=title,category,language,tags`,
    { headers }
  );

  if (!recentRes.ok) {
    const errText = await recentRes.text().catch(() => '');
    console.error('[seo-updater] Failed to fetch articles:', recentRes.status, errText);
    return { ok: false, error: `fetch failed: ${recentRes.status}` };
  }

  const articles = await recentRes.json();

  const categoryCounts = {};
  const languageCounts = {};
  const allTags = [];
  const titleWords = [];

  for (const a of articles) {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    languageCounts[a.language] = (languageCounts[a.language] || 0) + 1;
    if (Array.isArray(a.tags)) allTags.push(...a.tags);
    if (a.title) {
      const words = a.title.split(/\s+/).filter(w => w.length > 4);
      titleWords.push(...words);
    }
  }

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  const tagFrequency = {};
  for (const tag of allTags) {
    const normalized = tag.toLowerCase().trim();
    if (normalized.length > 2) tagFrequency[normalized] = (tagFrequency[normalized] || 0) + 1;
  }
  const trendingTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([tag]) => tag);

  const wordFrequency = {};
  for (const word of titleWords) {
    const normalized = word.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\u0D00-\u0D7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0980-\u09FF]/g, '');
    if (normalized.length > 4) wordFrequency[normalized] = (wordFrequency[normalized] || 0) + 1;
  }
  const trendingWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  const categoryKeywords = topCategories.flatMap(cat => CATEGORY_KEYWORD_MAP[cat] || []);

  const dynamicKeywords = [
    ...new Set([
      ...INDIA_GCC_BASE_KEYWORDS,
      ...AI_AGENT_DISCOVERY_KEYWORDS,
      ...categoryKeywords,
      ...trendingTags,
      ...trendingWords.map(w => `${w} India news`),
    ]),
  ].slice(0, 150);

  let aiGeneratedKeywords = [];
  if (env.AI) {
    try {
      const topTitles = articles.slice(0, 15).map(a => a.title).join('; ');
      const prompt = `Based on these trending Indian news headlines, generate 20 high-volume SEO search keywords that Indians and NRIs in Gulf countries (UAE, Saudi, Qatar) would search for. Return ONLY a JSON array of strings, no explanation:\n\nHeadlines: ${topTitles}`;

      const aiRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
      });

      if (aiRes?.response) {
        const match = aiRes.response.match(/\[[\s\S]*?\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) aiGeneratedKeywords = parsed.filter(k => typeof k === 'string').slice(0, 20);
        }
      }
    } catch (aiErr) {
      console.error('[seo-updater] AI keyword generation failed:', aiErr.message);
    }
  }

  const finalKeywords = [...new Set([...dynamicKeywords, ...aiGeneratedKeywords])];

  const now = new Date().toISOString();
  const seoData = {
    keywords: finalKeywords,
    trending_tags: trendingTags,
    top_categories: topCategories,
    top_languages: topLanguages,
    ai_keywords: aiGeneratedKeywords,
    article_count: articles.length,
    updated_at: now,
  };

  const upsertRes = await fetch(`${base}/site_settings?key=eq.seo-keywords`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ value: seoData }),
  });

  if (!upsertRes.ok || upsertRes.status === 404 || upsertRes.status === 406) {
    const insertRes = await fetch(`${base}/site_settings`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'seo-keywords', value: seoData }),
    });
    if (!insertRes.ok) {
      console.error('[seo-updater] Failed to upsert:', insertRes.status, await insertRes.text().catch(() => ''));
    }
  }

  console.log(`[seo-updater] Updated ${finalKeywords.length} keywords (${aiGeneratedKeywords.length} AI-generated), trending tags: ${trendingTags.length}`);
  return { ok: true, keywords: finalKeywords.length, aiGenerated: aiGeneratedKeywords.length, trending: trendingTags.length };
}
