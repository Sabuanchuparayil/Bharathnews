import { getFirebaseToken } from '../lib/firebase-auth.js';
import { runQuery } from '../lib/firestore-rest.js';

const DEFAULT_SITE_URL = 'https://www.thebharathnews.com';

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function handleSitemap(env) {
  const site = env.MAIN_SITE_URL || DEFAULT_SITE_URL;
  const token = await getFirebaseToken(env);
  const docs = await runQuery(env, {
    from: [{ collectionId: 'articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'published' },
      },
    },
    orderBy: [{ field: { fieldPath: 'publishedAt' }, direction: 'DESCENDING' }],
    limit: 1000,
  }, token);

  const articleUrls = docs
    .filter(d => d.slug)
    .map(d => {
      const date = d.publishedAt || new Date().toISOString();
      const lastmod = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
      return `  <url><loc>${site}/article/${escapeXml(encodeURIComponent(d.slug))}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
    });

  const staticPages = [
    { path: '', freq: 'hourly', priority: '1.0' },
    { path: 'india', freq: 'hourly', priority: '0.9' },
    { path: 'gcc', freq: 'hourly', priority: '0.9' },
    { path: 'business', freq: 'hourly', priority: '0.9' },
    { path: 'technology', freq: 'hourly', priority: '0.9' },
    { path: 'sports', freq: 'hourly', priority: '0.9' },
    { path: 'entertainment', freq: 'hourly', priority: '0.9' },
    { path: 'health', freq: 'daily', priority: '0.8' },
    { path: 'education', freq: 'daily', priority: '0.8' },
    { path: 'jobs', freq: 'daily', priority: '0.8' },
    { path: 'real-estate', freq: 'daily', priority: '0.8' },
    { path: 'world', freq: 'hourly', priority: '0.9' },
    { path: 'lifestyle', freq: 'daily', priority: '0.8' },
    { path: 'opinion', freq: 'daily', priority: '0.8' },
    { path: 'videos', freq: 'hourly', priority: '0.8' },
    { path: 'explore', freq: 'daily', priority: '0.7' },
    { path: 'community', freq: 'daily', priority: '0.6' },
    { path: 'search', freq: 'weekly', priority: '0.5' },
  ].map(p => `  <url><loc>${site}/${p.path}</loc><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.join('\n')}
${articleUrls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
