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

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('job_postings')
    .select('slug, title, description, company_name, country, city, job_type, salary_min, salary_max, salary_currency, published_at')
    .eq('status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('published_at', { ascending: false })
    .limit(50);

  if (country) query = query.eq('country', country.toLowerCase());

  const { data: jobs } = await query;

  const items = (jobs || []).map(job => {
    const link = `${SITE_URL}/jobs/${job.slug}`;
    const salary = job.salary_min
      ? `${job.salary_currency} ${job.salary_min}${job.salary_max ? '–' + job.salary_max : '+'}`
      : '';
    const location = `${countryLabel(job.country)}${job.city ? ', ' + job.city : ''}`;
    return `    <item>
      <title>${escapeXml(job.title)} — ${escapeXml(job.company_name)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(`${job.job_type} | ${location}${salary ? ' | ' + salary : ''}\n\n${job.description?.slice(0, 300)}`)}</description>
      <pubDate>${new Date(job.published_at || Date.now()).toUTCString()}</pubDate>
      <category>Jobs</category>
    </item>`;
  }).join('\n');

  const title = country
    ? `GCC Jobs — ${countryLabel(country)} | The Bharath News`
    : 'GCC Jobs | The Bharath News';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}/jobs</link>
    <description>Latest job opportunities for Indian professionals in GCC countries</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed/jobs-gcc${country ? '?country=' + encodeURIComponent(country) : ''}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
}
