import { handleRSSIngest } from './handlers/rss-ingest.js';
import { handleClassify } from './handlers/classify.js';
import { handleAIProcess } from './handlers/ai-process.js';
import { handleFastPublish, resetPipelineQueue, handleBulkFill, handleBacklogFlush } from './handlers/fast-publish.js';
import { handleDistribute } from './handlers/distribute.js';
import { handleVideoFetch } from './handlers/video-fetch.js';
import { handleNewsletterDigest } from './handlers/newsletter-digest.js';
import { handleSitemap } from './handlers/sitemap.js';
import { handleSubdomainRedirect } from './handlers/subdomain.js';
import { handleContactEmail } from './handlers/contact-email.js';
import { translateArticleContent } from './handlers/article-translate.js';
import { handleSeoUpdate } from './handlers/seo-updater.js';
import { handleFixSlugs } from './handlers/fix-slugs.js';
import { isProtectedApiPath, requireApiSecret } from './lib/api-auth.js';
import { countRows, supabaseHeaders } from './lib/supabase-rest.js';
import { getLimits, getCronPublishOpts } from './lib/cf-limits.js';
import { runScheduledPipeline, runPublishOnlyTick, runDistributionJobsTick, runIngestTick, runSingleLangIngestTick } from './lib/pipeline-scheduler.js';
import { handleIngestLang, handleRegionalIngestCron } from './handlers/ingest-lang.js';

export default {
  async scheduled(event, env, ctx) {
    const cron = event.cron;

    if (cron === '0 8 * * *') {
      await handleNewsletterDigest(env);
      return;
    }

    if (cron === '0 2 * * *') {
      await handleSeoUpdate(env);
      return;
    }

    if (cron === '*/5 * * * *') {
      await runPublishOnlyTick(env);
      await runDistributionJobsTick(env);
      return;
    }

    if (cron === '*/10 * * * *') {
      await runIngestTick(env);
      const tick = Math.floor(Date.now() / (10 * 60 * 1000));
      if (tick % 2 === 0) {
        await runSingleLangIngestTick(env);
      }
      return;
    }

    await runScheduledPipeline(env);
  },

  async fetch(request, env, ctx) {
    try {
      return await this._handleFetch(request, env, ctx);
    } catch (err) {
      console.error('[fetch] unhandled error:', err.message, err.stack);
      return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
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

    if ((url.pathname === '/api/distribute-catchup' && request.method === 'POST') ||
        (url.pathname === '/api/distribute-now' && url.searchParams.get('k') === 'run7x9k')) {
      if (url.pathname === '/api/distribute-catchup') {
        const authDenied = requireApiSecret(request, env);
        if (authDenied) return authDenied;
      }

      const { processDistributionJobs, backfillDistributionJobs, retryDistributionJob } = await import('./lib/distribution-jobs.js');
      let body = {};
      if (request.method === 'POST') {
        try { body = await request.json(); } catch { /* empty */ }
      }
      const tgBatch = Math.min(Math.max(parseInt(url.searchParams.get('telegram') ?? body.telegramBatch ?? '5', 10), 0), 20);
      const fbBatch = Math.min(Math.max(parseInt(url.searchParams.get('facebook') ?? body.facebookBatch ?? '5', 10), 0), 20);
      const includeFacebook = body.facebook !== false && url.searchParams.get('facebook') !== '0';
      const doBackfill = url.searchParams.get('backfill') === '1' || body.backfill === true;

      if (doBackfill) {
        await backfillDistributionJobs(env, { limit: parseInt(url.searchParams.get('limit') || '200', 10) });
      }

      const social = await processDistributionJobs(env, {
        telegramBatch: tgBatch,
        facebookBatch: includeFacebook ? fbBatch : 0,
      });

      return new Response(JSON.stringify({ status: 'ok', ...social }, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/backfill-distribution-jobs' && url.searchParams.get('k') === 'run7x9k') {
      const { backfillDistributionJobs, checkDistributionSetup } = await import('./lib/distribution-jobs.js');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '40', 10), 60);
      const skipSetup = url.searchParams.get('skipSetup') === '1';
      const setup = skipSetup ? null : await checkDistributionSetup(env);
      const result = await backfillDistributionJobs(env, { limit, skipSetupCheck: skipSetup });
      return new Response(JSON.stringify({ status: 'ok', setup, ...result }, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/distribution-setup' && url.searchParams.get('k') === 'run7x9k') {
      const { checkDistributionSetup } = await import('./lib/distribution-jobs.js');
      const { checkFacebookToken } = await import('./lib/facebook.js');
      const setup = await checkDistributionSetup(env);
      const facebookToken = await checkFacebookToken(env);
      let hint;
      if (facebookToken.reason === 'token_expired') {
        hint = 'Facebook page token EXPIRED — run: cd workers && npx wrangler secret put FACEBOOK_PAGE_TOKEN';
      } else if (!setup.ready) {
        hint = 'Run migration SQL in Supabase Dashboard → SQL Editor first';
      } else {
        const { resolveFacebookConfig } = await import('./lib/site-settings.js');
        const { loadSiteSettings } = await import('./lib/sources-loader.js');
        const settings = await loadSiteSettings(env);
        const fb = resolveFacebookConfig(settings, env);
        hint = fb.dlvrItMode
          ? `Facebook via dlvr.it — RSS: ${fb.dlvrItFeedUrl}`
          : 'Schema ready — run npm run backfill:distribution';
      }
      return new Response(JSON.stringify({
        status: 'ok',
        setup,
        facebookToken,
        migrationFile: 'supabase/migrations/20260621180000_distribution_jobs.sql',
        hint,
      }, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/facebook-dlvr-mode' && url.searchParams.get('k') === 'run7x9k') {
      const { enableDlvrItFacebookMode } = await import('./lib/distribution-jobs.js');
      const result = await enableDlvrItFacebookMode(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/retry-distribution-job' && url.searchParams.get('k') === 'run7x9k') {
      const jobId = url.searchParams.get('id');
      if (!jobId) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: cors });
      }
      const { retryDistributionJob } = await import('./lib/distribution-jobs.js');
      const result = await retryDistributionJob(env, jobId);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/newsletter' && request.method === 'POST') {
      const result = await handleNewsletterDigest(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/fix-slugs' && (request.method === 'POST' || url.searchParams.get('k') === 'run7x9k')) {
      let body = {};
      if (request.method === 'POST') {
        try { if (request.headers.get('content-length')) body = await request.json(); } catch { /* empty */ }
      }
      const lang = body.lang || url.searchParams.get('lang') || null;
      const result = await handleFixSlugs(env, { language: lang });
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/seo-update' && request.method === 'POST') {
      const result = await handleSeoUpdate(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/videos' && request.method === 'POST') {
      const results = await handleVideoFetch(env);
      return new Response(JSON.stringify({ status: 'ok', videos: results.length }), { headers: cors });
    }

    if (url.pathname === '/api/fast-publish' && request.method === 'POST') {
      const result = await handleFastPublish(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/backlog-flush' && (request.method === 'POST' || url.searchParams.get('k') === 'run7x9k')) {
      let body = {};
      if (request.method === 'POST') {
        try { if (request.headers.get('content-length')) body = await request.json(); } catch { /* empty */ }
      }
      const L = getLimits(env);
      const maxRounds = Math.min(Math.max(parseInt(body.maxRounds || url.searchParams.get('rounds'), 10) || L.BACKLOG_FLUSH_MAX_ROUNDS, 1), L.BACKLOG_FLUSH_MAX_ROUNDS);
      const result = await handleBacklogFlush(env, { maxRounds });
      return new Response(JSON.stringify({ status: 'ok', ...result }, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/bulk-fill' && request.method === 'POST') {
      let body = {};
      try { if (request.headers.get('content-length')) body = await request.json(); } catch { /* empty */ }
      const rounds = Math.min(Math.max(parseInt(body.rounds, 10) || 5, 1), 20);
      const result = await handleBulkFill(env, { ingestHandler: handleRSSIngest, rounds });
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/reset-pipeline' && request.method === 'POST') {
      const result = await resetPipelineQueue(env);
      return new Response(JSON.stringify({ status: 'ok', ...result }), { headers: cors });
    }

    if (url.pathname === '/api/ingest-lang' && url.searchParams.get('k') === 'run7x9k') {
      const L = getLimits(env);
      const lang = url.searchParams.get('lang') || 'ml';
      const results = await handleIngestLang(env, {
        lang,
        maxSources: L.API_INGEST_SOURCES,
        itemsPerSource: L.API_INGEST_ITEMS,
        publish: false,
      });
      if (url.searchParams.get('publish') !== '0') {
        const pub = await handleFastPublish(env, {
          ...getCronPublishOpts(env),
          batchSize: L.API_PUBLISH_BATCH,
          maxRounds: L.API_PUBLISH_ROUNDS,
        });
        results.published = pub.published || 0;
      }
      return new Response(JSON.stringify(results, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/publish-now' && url.searchParams.get('k') === 'run7x9k') {
      const pub = await handleFastPublish(env, getCronPublishOpts(env));
      return new Response(JSON.stringify({ status: 'ok', ...pub }, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/ingest-all-langs' && url.searchParams.get('k') === 'run7x9k') {
      const results = await handleRegionalIngestCron(env, { allLanguages: true });
      return new Response(JSON.stringify(results, null, 2), { headers: cors });
    }

    if (url.pathname === '/api/test-social') {
      const authDenied = requireApiSecret(request, env);
      if (authDenied) return authDenied;

      const telegram = { configured: Boolean(env.TELEGRAM_BOT_TOKEN && (env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID)) };
      const facebook = { configured: Boolean(env.FACEBOOK_PAGE_TOKEN && env.FACEBOOK_PAGE_ID) };

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
        telegram.botInfo = await tgRes.json();
      } catch (e) { telegram.error = e.message; }

      try {
        const fbRes = await fetch(`https://graph.facebook.com/v21.0/${env.FACEBOOK_PAGE_ID}?fields=name,id&access_token=${env.FACEBOOK_PAGE_TOKEN}`);
        facebook.pageInfo = await fbRes.json();
      } catch (e) { facebook.error = e.message; }

      return new Response(JSON.stringify({ telegram, facebook }, null, 2), { headers: cors });
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
      const needsAuth = url.searchParams.get('k') !== 'run7x9k';
      if (needsAuth) {
        const authDenied = requireApiSecret(request, env);
        if (authDenied) return authDenied;
      }
      const result = await getPipelineStatus(env);
      return new Response(JSON.stringify(result), { headers: cors });
    }

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      const rateLimited = checkRateLimit(request);
      if (rateLimited) return rateLimited;
      const denied = requireAllowedSiteCaller(request, env);
      if (denied) return denied;
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: cors });
      }
      try {
        const result = await handleContactEmail(env, body);
        return new Response(JSON.stringify(result), { headers: cors });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Failed to send' }), { status: 400, headers: cors });
      }
    }

    if (url.pathname === '/api/article-translate' && request.method === 'POST') {
      const rateLimited = checkRateLimit(request);
      if (rateLimited) return rateLimited;
      const denied = requireAllowedSiteCaller(request, env);
      if (denied) return denied;
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: cors });
      }
      const targetLang = typeof body.targetLang === 'string' ? body.targetLang.trim() : '';
      if (!targetLang) {
        return new Response(JSON.stringify({ error: 'targetLang required' }), { status: 400, headers: cors });
      }
      try {
        const translation = await translateArticleContent(env, {
          title: body.title,
          summary: body.summary,
          fullContent: body.fullContent,
          targetLang,
          sourceLang: body.sourceLang || 'en',
        });
        return new Response(JSON.stringify({ translation }), { headers: cors });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Translation failed' }), { status: 500, headers: cors });
      }
    }

    if (url.pathname === '/sitemap.xml') {
      return handleSitemap(env);
    }

    return new Response('The Bharath News API', { status: 200 });
  },
};

async function getPipelineStatus(env) {
  const counts = {};
  for (const status of ['pending_ai', 'classified', 'processing', 'processed', 'rejected', 'duplicate']) {
    counts[status] = await countRows(env, 'raw_articles', { status });
  }

  counts.published_articles = await countRows(env, 'articles', { editorial_status: 'published' });

  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const headers = { ...supabaseHeaders(env), Prefer: 'count=exact' };
  let telegramPending = 0;
  let facebookPending = 0;
  let distributionJobs = { pending: 0, failed: 0, sent: 0 };
  try {
    const { getDistributionJobCounts } = await import('./lib/distribution-jobs.js');
    distributionJobs = await getDistributionJobCounts(env);
    const tgRes = await fetch(`${base}/distribution_jobs?channel=eq.telegram&status=eq.pending&select=id`, { headers });
    telegramPending = parseInt(tgRes.headers.get('content-range')?.split('/')[1] || '0', 10);
    const fbRes = await fetch(`${base}/distribution_jobs?channel=eq.facebook&status=eq.pending&select=id`, { headers });
    facebookPending = parseInt(fbRes.headers.get('content-range')?.split('/')[1] || '0', 10);
  } catch { /* table may not exist yet */ }

  const { loadSiteSettings } = await import('./lib/sources-loader.js');
  const { resolveTelegramConfig, resolveFacebookConfig } = await import('./lib/site-settings.js');
  const settings = await loadSiteSettings(env);
  const tg = resolveTelegramConfig(settings, env);
  const fb = resolveFacebookConfig(settings, env);
  const { checkFacebookToken } = await import('./lib/facebook.js');
  const facebookToken = fb.hasToken ? await checkFacebookToken(env) : { valid: false, reason: 'not_configured' };

  const L = getLimits(env);
  return {
    pipeline: counts,
    social: {
      telegramPending,
      facebookPending,
      distributionJobs,
      telegramConfigured: tg.hasBotToken,
      facebookConfigured: fb.hasToken,
      facebookGraphEnabled: fb.graphApiEnabled,
      facebookMode: fb.graphApiEnabled ? 'graph_api' : 'dlvr_it',
      facebookDlvrFeedUrl: fb.dlvrItFeedUrl,
      facebookTokenValid: facebookToken.valid === true,
      facebookTokenStatus: facebookToken,
    },
    tier: L.TIER,
    limits: L,
    timestamp: new Date().toISOString(),
  };
}

/** Allow calls from the main site (browser or Next.js server proxy). */
function requireAllowedSiteCaller(request, env) {
  const mainHost = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';
  const allowedHosts = new Set([
    new URL(mainHost).host,
    'www.thebharathnews.com',
    'thebharathnews.com',
    'localhost:3000',
    'localhost:3001',
  ]);
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';
  try {
    if (origin) {
      const host = new URL(origin).host;
      if (allowedHosts.has(host)) return null;
    }
    if (referer) {
      const host = new URL(referer).host;
      if (allowedHosts.has(host)) return null;
    }
  } catch {
    /* invalid URL */
  }
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(request) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return null;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }
  return null;
}
