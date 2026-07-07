import { getSupabaseAdmin } from '@/lib/supabase-server';
import { SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PUBLICATION_NAME = 'The Bharath News';
const MAX_ITEMS = 1000;
const HOURS_WINDOW = 48;

const LANG_RSS = {
  en: 'en',
  hi: 'hi',
  ml: 'ml',
  ta: 'ta',
  te: 'te',
  kn: 'kn',
  bn: 'bn',
  ur: 'ur',
};

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(row) {
  const raw = row.published_at || row.created_at;
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function GET() {
  let articles = [];
  try {
    const supabase = getSupabaseAdmin();
    const since = new Date(Date.now() - HOURS_WINDOW * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('articles')
      .select('slug, title, published_at, created_at, language')
      .or('editorial_status.eq.published,editorial_status.is.null')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS);

    articles = (data || []).filter(row => row.slug && row.title);
  } catch (err) {
    console.error('[news-sitemap] Failed to fetch articles:', err.message);
  }

  const items = articles.map(row => {
    const lang = LANG_RSS[row.language] || 'en';
    return `
  <url>
    <loc>${escapeXml(`${SITE_URL}/article/${row.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(toIsoDate(row))}</news:publication_date>
      <news:title>${escapeXml(row.title)}</news:title>
    </news:news>
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    },
  });
}
