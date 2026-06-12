import { handleRSSIngest } from './handlers/rss-ingest.js';
import { handleClassify } from './handlers/classify.js';
import { handleAIProcess } from './handlers/ai-process.js';
import { handleDistribute } from './handlers/distribute.js';
import { handleVideoFetch } from './handlers/video-fetch.js';
import { handleNewsletterDigest } from './handlers/newsletter-digest.js';
import { handleSitemap } from './handlers/sitemap.js';
import { handleSubdomainRedirect } from './handlers/subdomain.js';
import { isProtectedApiPath, requireApiSecret } from './lib/api-auth.js';
import { getFirebaseToken } from './lib/firebase-auth.js';
import { runQuery, FIRESTORE_BASE } from './lib/firestore-rest.js';

export default {
  async scheduled(event, env, ctx) {
    const cron = event.cron;

    if (cron === '0 8 * * *') {
      await handleNewsletterDigest(env);
      return;
    }

    // Workers free tier caps each invocation at 50 subrequests, so we cannot run the
    // whole pipeline in one go. Rotate ONE stage per 15-min run. A full cycle
    // (ingest → classify → process → video) completes each hour and then repeats,
    // keeping new content flowing continuously.
    const slot = Math.floor(Date.now() / (15 * 60 * 1000)) % 4;
    const stages = [
      ['ingest', () => handleRSSIngest(env)],
      ['classify', () => handleClassify(env)],
      ['process', () => handleAIProcess(env)],
      ['video', () => handleVideoFetch(env)],
    ];
    const [name, run] = stages[slot];
    console.log(`[cron] ${cron} → stage "${name}" at ${new Date().toISOString()}`);
    try {
      const result = await run();
      console.log(`[cron] stage "${name}" done:`, Array.isArray(result) ? result.length : result);
    } catch (err) {
      console.error(`[cron] stage "${name}" failed:`, err.message);
    }
  },

  async fetch(request, env, ctx) {
    try {
      return await this._handleFetch(request, env, ctx);
    } catch (err) {
      console.error('[fetch] unhandled error:', err.message, err.stack);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async _handleFetch(request, env, ctx) {
    const subdomainRedirect = handleSubdomainRedirect(request, env);
    if (subdomainRedirect) return subdomainRedirect;

    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const mainHost = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';
    const allowedOrigins = [mainHost, 'http://localhost:3000', 'http://localhost:3001'];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : mainHost;
    const cors = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin,
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }

    if (isProtectedApiPath(url.pathname) && request.method === 'POST') {
      const denied = requireApiSecret(request, env);
      if (denied) return denied;
    }

    if (url.pathname === '/api/ingest' && request.method === 'POST') {
      const results = await handleRSSIngest(env);
      return new Response(JSON.stringify({ status: 'ok', articles: results.length }), { headers: cors });
    }

    if (url.pathname === '/api/classify' && request.method === 'POST') {
      const result = await handleClassify(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/process' && request.method === 'POST') {
      const result = await handleAIProcess(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/distribute' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: cors });
      }
      const articleId = typeof body.articleId === 'string' ? body.articleId.trim() : '';
      if (!articleId || articleId.length > 200 || /[\/\.\#\[\]\*]/.test(articleId)) {
        return new Response(JSON.stringify({ error: 'Invalid articleId' }), { status: 400, headers: cors });
      }
      await handleDistribute(env, articleId);
      return new Response(JSON.stringify({ status: 'ok' }), { headers: cors });
    }

    if (url.pathname === '/api/newsletter' && request.method === 'POST') {
      const result = await handleNewsletterDigest(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/videos' && request.method === 'POST') {
      const results = await handleVideoFetch(env);
      return new Response(JSON.stringify({ status: 'ok', videos: results.length }), { headers: cors });
    }

    if (url.pathname === '/api/reset-rejected' && request.method === 'POST') {
      const result = await resetRejectedArticles(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/test-feed') {
      const authDenied = requireApiSecret(request, env);
      if (authDenied) return authDenied;

      const feedUrl = (url.searchParams.get('url') || '').trim();
      if (!feedUrl) {
        return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), { status: 400, headers: cors });
      }

      let parsed;
      try { parsed = new URL(feedUrl); } catch {
        return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: cors });
      }
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return new Response(JSON.stringify({ error: 'Only http/https URLs allowed' }), { status: 400, headers: cors });
      }
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', 'metadata.google.internal', '169.254.169.254'];
      if (blockedHosts.some(h => parsed.hostname === h) || /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) {
        return new Response(JSON.stringify({ error: 'Internal addresses not allowed' }), { status: 403, headers: cors });
      }

      const isGN = feedUrl.includes('news.google.com/');
      if (isGN) {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        return new Response(JSON.stringify({
          url: feedUrl, proxy: 'rss2json', proxyStatus: res.status,
          status: data.status, count: (data.items || []).length,
          sample: (data.items || []).slice(0, 2).map(i => ({ title: (i.title || '').slice(0, 60) })),
          error: data.message || null,
        }), { headers: cors });
      }
      const { fetchAndParseFeed } = await import('./lib/rss-parser.js');
      const items = await fetchAndParseFeed(feedUrl);
      const sample = items.slice(0, 3).map(i => ({ title: (i.title || '').slice(0, 60), link: !!i.link }));
      return new Response(JSON.stringify({ url: feedUrl, count: items.length, sample }), { headers: cors });
    }

    if (url.pathname === '/api/pipeline-status') {
      const authDenied = requireApiSecret(request, env);
      if (authDenied) return authDenied;
      const result = await getPipelineStatus(env);
      return new Response(JSON.stringify(result), { headers: cors });
    }

    if (url.pathname === '/sitemap.xml') {
      return handleSitemap(env);
    }

    return new Response('The Bharath News API', { status: 200 });
  },
};

async function resetRejectedArticles(env) {
  const token = await getFirebaseToken(env);
  const rejected = await runQuery(env, {
    from: [{ collectionId: 'raw_articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'rejected' },
      },
    },
    limit: 50,
  }, token);

  let reset = 0;
  for (const doc of rejected) {
    const slug = doc.slug || doc.id;
    const docPath = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/raw_articles/${slug}`;
    const res = await fetch(`https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=status&updateMask.fieldPaths=editorialStatus`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fields: {
          status: { stringValue: 'pending_ai' },
          editorialStatus: { stringValue: 'pending' },
        },
      }),
    });
    if (res.ok) reset++;
  }
  return { found: rejected.length, reset };
}

async function getPipelineStatus(env) {
  const token = await getFirebaseToken(env);
  const counts = {};
  for (const status of ['pending_ai', 'classified', 'processing', 'processed', 'rejected', 'duplicate']) {
    const docs = await runQuery(env, {
      from: [{ collectionId: 'raw_articles' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: status },
        },
      },
      limit: 1,
    }, token);
    counts[status] = docs.length > 0 ? '1+' : '0';
  }

  const articles = await runQuery(env, {
    from: [{ collectionId: 'articles' }],
    limit: 1,
  }, token);
  counts.published_articles = articles.length > 0 ? '1+' : '0';

  return { pipeline: counts, timestamp: new Date().toISOString() };
}
