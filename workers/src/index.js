import { handleRSSIngest } from './handlers/rss-ingest.js';
import { handleAIProcess } from './handlers/ai-process.js';
import { handleDistribute } from './handlers/distribute.js';
import { handleVideoFetch } from './handlers/video-fetch.js';
import { handleSitemap } from './handlers/sitemap.js';

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleRSSIngest(env));
    ctx.waitUntil(handleVideoFetch(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/ingest' && request.method === 'POST') {
      ctx.waitUntil(handleRSSIngest(env));
      return new Response(JSON.stringify({ status: 'ingestion started' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/process' && request.method === 'POST') {
      ctx.waitUntil(handleAIProcess(env));
      return new Response(JSON.stringify({ status: 'processing started' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/api/distribute' && request.method === 'POST') {
      const body = await request.json();
      ctx.waitUntil(handleDistribute(env, body.articleId));
      return new Response(JSON.stringify({ status: 'distribution started' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/sitemap.xml') {
      return handleSitemap(env);
    }

    return new Response('The Bharath News API', { status: 200 });
  },
};
