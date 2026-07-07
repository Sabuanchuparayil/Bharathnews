const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

const DEFAULT_KEY = 'bharathnews2026indexnowkey';
const DEFAULT_HOST = 'www.thebharathnews.com';

function normalizeUrls(urls, siteUrl) {
  const base = (siteUrl || `https://${DEFAULT_HOST}`).replace(/\/$/, '');
  return [...new Set((urls || []).map(u => {
    if (!u) return null;
    if (u.startsWith('http')) return u;
    return `${base}${u.startsWith('/') ? u : `/${u}`}`;
  }).filter(Boolean))].slice(0, 10000);
}

export async function pingIndexNow(env, urls) {
  const key = env.INDEXNOW_KEY || DEFAULT_KEY;
  const siteUrl = env.MAIN_SITE_URL || `https://${DEFAULT_HOST}`;
  const host = env.MAIN_SITE_HOST || DEFAULT_HOST;
  const urlList = normalizeUrls(urls, siteUrl);
  if (!urlList.length) return { ok: false, reason: 'no_urls' };

  const body = {
    host,
    key,
    keyLocation: `${siteUrl.replace(/\/$/, '')}/indexnow-key.txt`,
    urlList,
  };

  const results = [];
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });
      results.push({ endpoint, status: res.status, ok: res.ok || res.status === 202 });
    } catch (err) {
      results.push({ endpoint, ok: false, error: err.message });
    }
  }

  const ok = results.some(r => r.ok);
  if (!ok) {
    console.warn('[indexnow] ping failed:', results);
  } else {
    console.log('[indexnow] pinged', urlList.length, 'url(s)');
  }
  return { ok, results, count: urlList.length };
}

export async function pingArticlePublished(env, article) {
  if (!article?.slug) return { ok: false, reason: 'no_slug' };
  const siteUrl = env.MAIN_SITE_URL || `https://${DEFAULT_HOST}`;
  return pingIndexNow(env, [`${siteUrl.replace(/\/$/, '')}/article/${article.slug}`]);
}
