import { handleRSSIngest } from './handlers/rss-ingest.js';
import { handleClassify } from './handlers/classify.js';
import { handleAIProcess } from './handlers/ai-process.js';
import { handleDistribute } from './handlers/distribute.js';
import { handleVideoFetch } from './handlers/video-fetch.js';
import { handleNewsletterDigest } from './handlers/newsletter-digest.js';
import { handleSitemap } from './handlers/sitemap.js';
import { handleSubdomainRedirect } from './handlers/subdomain.js';

export default {
  async scheduled(event, env, ctx) {
    const cron = event.cron;
    if (cron === '0 8 * * *') {
      await handleNewsletterDigest(env);
      return;
    }
    await handleRSSIngest(env);
    await handleVideoFetch(env);
    await handleClassify(env);
    await handleAIProcess(env);
  },

  async fetch(request, env, ctx) {
    const subdomainRedirect = handleSubdomainRedirect(request, env);
    if (subdomainRedirect) return subdomainRedirect;

    const url = new URL(request.url);
    const cors = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

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
      const body = await request.json();
      await handleDistribute(env, body.articleId);
      return new Response(JSON.stringify({ status: 'ok' }), { headers: cors });
    }

    if (url.pathname === '/api/newsletter' && request.method === 'POST') {
      const result = await handleNewsletterDigest(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/sitemap.xml') {
      return handleSitemap(env);
    }

    return new Response('The Bharath News API', { status: 200 });
  },
};
