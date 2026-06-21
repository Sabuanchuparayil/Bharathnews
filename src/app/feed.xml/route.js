import { getSupabaseAdmin } from '@/lib/supabase-server';
import { SITE_URL } from '@/lib/site-url';

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getProxiedImageUrl(imageUrl) {
  if (!imageUrl) return '';
  if (imageUrl.startsWith(SITE_URL)) return imageUrl;
  return `${SITE_URL}/_next/image?url=${encodeURIComponent(imageUrl)}&w=1200&q=80`;
}

const SUPPORTED_FEED_LANGS = ['en', 'hi', 'ml', 'ta', 'te', 'kn', 'bn', 'ur'];

const LANG_TITLE = {
  en: 'The Bharath News',
  hi: 'The Bharath News — हिन्दी',
  ml: 'The Bharath News — മലയാളം',
  ta: 'The Bharath News — தமிழ்',
  te: 'The Bharath News — తెలుగు',
  kn: 'The Bharath News — ಕನ್ನಡ',
  bn: 'The Bharath News — বাংলা',
  ur: 'The Bharath News — اردو',
};

const LANG_RSS_CODE = {
  en: 'en-in', hi: 'hi-in', ml: 'ml-in', ta: 'ta-in',
  te: 'te-in', kn: 'kn-in', bn: 'bn-in', ur: 'ur-in',
};

// Native-script discovery hashtag per language (kept to one for cleanliness)
const LANG_HASHTAG = {
  en: '#TheBharathNews',
  hi: '#हिंदीसमाचार',
  ml: '#മലയാളംവാർത്ത',
  ta: '#தமிழ்செய்திகள்',
  te: '#తెలుగువార్తలు',
  kn: '#ಕನ್ನಡಸುದ್ದಿ',
  bn: '#বাংলাসংবাদ',
  ur: '#اردونیوز',
};

// 1–2 topical hashtags per category (Facebook best practice: keep total small)
const CATEGORY_HASHTAGS = {
  india: ['#IndiaNews'],
  world: ['#WorldNews'],
  business: ['#Business', '#Markets'],
  technology: ['#Tech'],
  sports: ['#Sports', '#Cricket'],
  entertainment: ['#Entertainment'],
  health: ['#Health'],
  education: ['#Education'],
  gcc: ['#Gulf', '#GCC'],
  opinion: ['#Opinion'],
  lifestyle: ['#Lifestyle'],
  jobs: ['#Jobs'],
  'real-estate': ['#RealEstate'],
};

const BRAND_HASHTAG = '#TheBharathNews';

/** dlvr.it social channels — cap window even when URL still has limit=50/200 */
const SOCIAL_FEED_LANGS = new Set(['en', 'ml']);
const SOCIAL_FEED_DEFAULT_HOURS = 24;
const SOCIAL_FEED_MAX_ITEMS = 25;

function buildHashtags(category, lang) {
  const tags = new Set([BRAND_HASHTAG]);
  for (const t of (CATEGORY_HASHTAGS[category] || [])) tags.add(t);
  if (LANG_HASHTAG[lang] && lang !== 'en') tags.add(LANG_HASHTAG[lang]);
  // Cap at 4 to protect Facebook reach
  return Array.from(tags).slice(0, 4).join(' ');
}

export async function GET(request) {
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang');
  const lang = SUPPORTED_FEED_LANGS.includes(langParam) ? langParam : null;
  const limitParam = parseInt(url.searchParams.get('limit'), 10);
  let limit = limitParam > 0 ? Math.min(limitParam, 200) : 50;
  const hoursParam = parseInt(url.searchParams.get('hours'), 10);
  let hours = hoursParam > 0 ? Math.min(hoursParam, 168) : 0;

  // dlvr.it URLs are read-only after creation — enforce social window for en/ml feeds.
  if (lang && SOCIAL_FEED_LANGS.has(lang)) {
    limit = Math.min(limit, SOCIAL_FEED_MAX_ITEMS);
    if (!hours) hours = SOCIAL_FEED_DEFAULT_HOURS;
  }

  let articles = [];
  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('articles')
      .select('title, slug, summary, published_at, created_at, category, source, image_url, language')
      .or('editorial_status.eq.published,editorial_status.is.null')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (lang) query = query.eq('language', lang);
    if (hours > 0) {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', since);
    }

    const { data } = await query;

    articles = (data || []).map(d => {
      // Use the time WE added the article (created_at) for the feed item date so
      // RSS consumers (dlvr.it, etc.) reliably see freshly-ingested items as new,
      // even when the original source published date is older.
      const itemDate = d.created_at || d.published_at;
      const pubDate = itemDate ? new Date(itemDate) : new Date();
      const category = d.category || 'news';
      const itemLang = d.language || lang || 'en';
      const hashtags = buildHashtags(category, itemLang);
      const baseDescription = d.summary || '';
      return {
        title: d.title || '',
        link: `${SITE_URL}/article/${d.slug}`,
        description: hashtags ? `${baseDescription}\n\n${hashtags}` : baseDescription,
        pubDate: pubDate.toUTCString(),
        category,
        author: d.source || 'The Bharath News',
        image: d.image_url ? getProxiedImageUrl(d.image_url) : '',
      };
    });
  } catch (err) {
    console.error('[feed.xml] Failed to fetch articles:', err.message);
  }

  const feedTitle = lang ? (LANG_TITLE[lang] || 'The Bharath News') : 'The Bharath News';
  const feedLangCode = lang ? (LANG_RSS_CODE[lang] || 'en-in') : 'en-in';
  const selfUrl = lang ? `${SITE_URL}/feed.xml?lang=${lang}` : `${SITE_URL}/feed.xml`;

  const items = articles.map(a => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${a.link}</link>
      <guid isPermaLink="true">${a.link}</guid>
      <description>${escapeXml(a.description)}</description>
      <pubDate>${a.pubDate}</pubDate>
      <category>${escapeXml(a.category)}</category>
      <author>${escapeXml(a.author)}</author>${a.image ? `
      <enclosure url="${escapeXml(a.image)}" type="image/jpeg" />
      <media:content url="${escapeXml(a.image)}" medium="image" type="image/jpeg" />
      <media:thumbnail url="${escapeXml(a.image)}" />` : ''}
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${SITE_URL}</link>
    <description>Breaking news from India and GCC regions. Business, technology, sports, and community stories.</description>
    <language>${feedLangCode}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Short cache so RSS-to-social tools (dlvr.it) pick up new articles quickly.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
