import { getSupabaseAdmin } from '@/lib/supabase-server';
import { countryLabel } from '@/lib/marketplace-constants';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebharathnews.com';

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(request) {
  const url = new URL(request.url);
  const country = url.searchParams.get('country');
  const category = url.searchParams.get('category');

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('classifieds')
    .select('slug, title, description, category, listing_type, price, price_currency, price_type, country, city, images, published_at')
    .eq('status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('published_at', { ascending: false })
    .limit(50);

  if (country) query = query.eq('country', country.toLowerCase());
  if (category) query = query.eq('category', category);

  const { data: items } = await query;

  const rssItems = (items || []).map(item => {
    const link = `${SITE_URL}/classifieds/${item.slug}`;
    const location = `${countryLabel(item.country)}${item.city ? ', ' + item.city : ''}`;
    const priceStr = item.price ? `${item.price_currency} ${item.price}` : (item.price_type === 'contact' ? 'Contact for Price' : 'Free');
    const imageTag = item.images?.[0] ? `\n      <enclosure url="${escapeXml(item.images[0])}" type="image/jpeg" length="0"/>` : '';
    return `    <item>
      <title>${escapeXml(item.title)} — ${escapeXml(priceStr)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(`${item.listing_type} | ${item.category} | ${location}\n\n${item.description?.slice(0, 300)}`)}</description>
      <pubDate>${new Date(item.published_at || Date.now()).toUTCString()}</pubDate>
      <category>${escapeXml(item.category)}</category>${imageTag}
    </item>`;
  }).join('\n');

  const title = country
    ? `Classifieds — ${countryLabel(country)} | The Bharath News`
    : 'GCC Classifieds | The Bharath News';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}/classifieds</link>
    <description>Classifieds for the Indian expat community in GCC</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed/classifieds-gcc${country || category ? '?' + [country ? 'country=' + encodeURIComponent(country) : '', category ? 'category=' + encodeURIComponent(category) : ''].filter(Boolean).join('&amp;') : ''}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
}
