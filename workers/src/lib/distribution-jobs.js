/**
 * Durable distribution queue — Telegram + Facebook with retries and backoff.
 * Replaces fragile catch-up scans; failures are retried automatically.
 */
import { postArticleToTelegram } from './telegram.js';
import { postToFacebook } from './facebook.js';
import { loadSiteSettings } from './sources-loader.js';
import { resolveFacebookConfig, resolveTelegramConfig, mergeSiteSettings } from './site-settings.js';
import { supabaseHeaders, supabaseBase, patchRow, getSiteSettingsRow } from './supabase-rest.js';
import { getLimits } from './cf-limits.js';
import { isBlockedPublisher } from './blocked-sources.js';

const BACKOFF_MINUTES = [2, 5, 15, 60, 240];
const JOB_BATCH_FREE = { telegram: 2, facebook: 1 };
const JOB_BATCH_PAID = { telegram: 4, facebook: 2 };

function jobBatch(env) {
  return getLimits(env).TIER === 'paid' ? JOB_BATCH_PAID : JOB_BATCH_FREE;
}

function headers(env, prefer = 'return=representation') {
  return { ...supabaseHeaders(env), Prefer: prefer };
}

function nextRetryAt(attempts) {
  const mins = BACKOFF_MINUTES[Math.min(attempts, BACKOFF_MINUTES.length - 1)];
  return new Date(Date.now() + mins * 60 * 1000).toISOString();
}

function buildJobRowsForArticle(article, settings, env) {
  if (!article?.id) return [];
  if (isBlockedPublisher({ name: article.source, sourceUrl: article.source_url || article.sourceUrl })) {
    return [];
  }

  const tg = resolveTelegramConfig(settings, env);
  const fb = resolveFacebookConfig(settings, env);
  const score = article.score ?? article.quality_score ?? article.qualityScore ?? 0;
  const lang = article.language || 'en';
  const rows = [];

  if (tg.enabled && tg.hasBotToken && score >= tg.minScore
      && !article.telegram_posted_at && !article.telegramPostedAt
      && !article.distributed?.telegram) {
    rows.push({ article_id: article.id, channel: 'telegram', status: 'pending' });
  }

  if (fb.enabled && fb.graphApiEnabled && fb.hasToken && score >= fb.minScore
      && !article.distributed?.facebook && !article.facebook_posted_at && !article.facebookPostedAt
      && (!fb.postLanguage || lang === fb.postLanguage)) {
    rows.push({ article_id: article.id, channel: 'facebook', status: 'pending' });
  }

  return rows;
}

async function bulkInsertJobs(env, rows) {
  if (!rows.length) return { enqueued: 0 };

  const CHUNK = 40;
  let enqueued = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const res = await fetch(`${supabaseBase(env)}/distribution_jobs?on_conflict=article_id,channel`, {
      method: 'POST',
      headers: headers(env, 'resolution=ignore-duplicates,return=minimal'),
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[distribution-jobs] bulk insert failed:', err.slice(0, 200));
      return { enqueued, error: err.slice(0, 200) };
    }
    enqueued += chunk.length;
  }

  return { enqueued };
}

/** Create pending jobs when an article is published (idempotent). */
export async function enqueueDistributionJobs(env, article, settings = null) {
  const cfg = settings || await loadSiteSettings(env);
  const rows = buildJobRowsForArticle(article, cfg, env);
  if (!rows.length) return { enqueued: 0 };
  return bulkInsertJobs(env, rows);
}

const ARTICLE_SELECT_BASE = 'id,slug,title,summary,score,quality_score,image_url,category,source_url,source,language,distributed,telegram_posted_at';

async function fetchPublishedArticles(env, limit, settings) {
  const base = supabaseBase(env);
  const h = supabaseHeaders(env);
  const fb = resolveFacebookConfig(settings, env);
  const select = ARTICLE_SELECT_BASE;

  const queries = [
    `${base}/articles?editorial_status=eq.published&telegram_posted_at=is.null&order=created_at.desc&limit=${limit}&select=${select}`,
  ];

  if (fb.graphApiEnabled) {
    queries.push(
      `${base}/articles?editorial_status=eq.published&language=eq.ml&or=(distributed->facebook.is.null,distributed->facebook.eq.false)&order=created_at.desc&limit=${Math.ceil(limit / 2)}&select=${select}`
    );
  }

  const byId = new Map();

  for (const url of queries) {
    let res = await fetch(`${url},facebook_posted_at`, { headers: h });
    if (res.status === 400) res = await fetch(url, { headers: h });
    if (!res.ok) {
      const body = await res.text();
      return { articles: [], error: `articles fetch ${res.status}: ${body.slice(0, 200)}` };
    }
    for (const row of await res.json()) {
      if (row?.id) byId.set(row.id, row);
    }
  }

  return { articles: [...byId.values()].slice(0, limit), error: null };
}

async function fetchArticleForJob(env, articleId) {
  const base = supabaseBase(env);
  const h = supabaseHeaders(env);
  const q = `${base}/articles?id=eq.${articleId}&select=${ARTICLE_SELECT_BASE}`;
  let res = await fetch(`${q},facebook_posted_at`, { headers: h });
  if (res.status === 400) res = await fetch(q, { headers: h });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

/** Verify DB schema for distribution queue. */
export async function checkDistributionSetup(env) {
  const base = supabaseBase(env);
  const h = supabaseHeaders(env);
  const jobsRes = await fetch(`${base}/distribution_jobs?select=id&limit=1`, { headers: h });
  const jobsTable = jobsRes.ok;
  const colRes = await fetch(`${base}/articles?select=facebook_posted_at&limit=1`, { headers: h });
  return {
    jobsTable,
    fbColumn: colRes.ok,
    ready: jobsTable,
    migrationRequired: !jobsTable,
  };
}

async function fetchPendingJobs(env, channel, limit) {
  const now = new Date().toISOString();
  const res = await fetch(
    `${supabaseBase(env)}/distribution_jobs?channel=eq.${channel}&status=eq.pending&next_retry_at=lte.${now}&order=created_at.asc&limit=${limit}&select=id,article_id,channel,attempts,max_attempts,status`,
    { headers: supabaseHeaders(env) }
  );
  if (!res.ok) return [];
  return res.json();
}

async function patchJob(env, jobId, updates) {
  await fetch(`${supabaseBase(env)}/distribution_jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    headers: headers(env, 'return=minimal'),
    body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
  });
}

async function markJobSent(env, job, article) {
  const now = new Date().toISOString();
  await patchJob(env, job.id, { status: 'sent', sent_at: now, last_error: null });

  if (job.channel === 'telegram') {
    await patchRow(env, 'articles', 'id', article.id, {
      telegram_posted_at: now,
      distributed: { ...(article.distributed || {}), telegram: true },
    });
  } else if (job.channel === 'facebook') {
    const patch = { distributed: { ...(article.distributed || {}), facebook: true } };
    await patchRow(env, 'articles', 'id', article.id, patch);
  }
}

async function markJobFailed(env, job, errorMsg, { permanent = false } = {}) {
  const attempts = (job.attempts || 0) + 1;
  const maxAttempts = job.max_attempts || 5;

  if (permanent || attempts >= maxAttempts) {
    await patchJob(env, job.id, {
      status: 'failed',
      attempts,
      last_error: errorMsg.slice(0, 500),
    });
    return;
  }

  await patchJob(env, job.id, {
    status: 'pending',
    attempts,
    last_error: errorMsg.slice(0, 500),
    next_retry_at: nextRetryAt(attempts),
  });
}

async function markJobSkipped(env, job, reason) {
  await patchJob(env, job.id, {
    status: 'skipped',
    last_error: reason.slice(0, 500),
  });
}

async function processOneJob(env, job, settings, siteUrl) {
  await patchJob(env, job.id, { status: 'processing' });

  const article = await fetchArticleForJob(env, job.article_id);
  if (!article) {
    await markJobSkipped(env, job, 'article_not_found');
    return { outcome: 'skipped' };
  }

  if (isBlockedPublisher({ name: article.source, sourceUrl: article.source_url })) {
    await markJobSkipped(env, job, 'blocked_publisher');
    return { outcome: 'skipped' };
  }

  try {
    if (job.channel === 'telegram') {
      if (article.telegram_posted_at) {
        await markJobSent(env, job, article);
        return { outcome: 'sent', channel: 'telegram', slug: article.slug };
      }
      const tg = resolveTelegramConfig(settings, env);
      const chatId = env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID || tg.channelId;
      await postArticleToTelegram(env, {
        title: article.title,
        slug: article.slug,
        excerpt: article.summary || '',
        image_url: article.image_url,
        category: article.category,
        source_url: article.source_url,
        siteUrl,
      }, chatId);
      await markJobSent(env, job, article);
      return { outcome: 'sent', channel: 'telegram', slug: article.slug };
    }

    if (job.channel === 'facebook') {
      if (article.facebook_posted_at || article.distributed?.facebook) {
        await markJobSent(env, job, article);
        return { outcome: 'sent', channel: 'facebook', slug: article.slug };
      }
      const result = await postToFacebook(env, article, settings, { skipPatch: true });
      if (result?.id || result?.post_id) {
        await markJobSent(env, job, article);
        return { outcome: 'sent', channel: 'facebook', slug: article.slug };
      }
      if (result?.skipped) {
        await markJobSkipped(env, job, result.skipped);
        return { outcome: 'skipped', slug: article.slug, reason: result.skipped };
      }
      const errMsg = result?.error || 'Facebook post returned no id';
      await markJobFailed(env, job, errMsg, { permanent: result?.tokenExpired || result?.missingPermissions });
      return { outcome: 'failed', channel: 'facebook', slug: article.slug, error: errMsg, tokenExpired: result?.tokenExpired, missingPermissions: result?.missingPermissions };
    }

    await markJobSkipped(env, job, 'unknown_channel');
    return { outcome: 'skipped' };
  } catch (e) {
    await markJobFailed(env, job, e.message || String(e));
    return { outcome: 'failed', channel: job.channel, slug: article.slug, error: e.message };
  }
}

/** Process pending distribution jobs for both channels. */
export async function processDistributionJobs(env, options = {}) {
  const settings = await loadSiteSettings(env);
  const fb = resolveFacebookConfig(settings, env);
  const batch = jobBatch(env);
  const tgLimit = options.telegramBatch ?? batch.telegram;
  const fbLimit = fb.graphApiEnabled ? (options.facebookBatch ?? batch.facebook) : 0;
  const siteUrl = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';

  const [tgJobs, fbJobs] = await Promise.all([
    tgLimit > 0 ? fetchPendingJobs(env, 'telegram', tgLimit) : [],
    fbLimit > 0 ? fetchPendingJobs(env, 'facebook', fbLimit) : [],
  ]);

  const results = { telegramSent: 0, facebookSent: 0, failed: 0, skipped: 0, errors: [] };

  for (const job of tgJobs) {
    const r = await processOneJob(env, job, settings, siteUrl);
    if (r.outcome === 'sent') results.telegramSent++;
    else if (r.outcome === 'failed') { results.failed++; results.errors.push(r); }
    else results.skipped++;
    if (results.telegramSent < tgLimit) await new Promise(res => setTimeout(res, 400));
  }

  for (const job of fbJobs) {
    const r = await processOneJob(env, job, settings, siteUrl);
    if (r.outcome === 'sent') results.facebookSent++;
    else if (r.outcome === 'failed') { results.failed++; results.errors.push(r); }
    else results.skipped++;
  }

  console.log('[distribution-jobs] processed:', results);
  return results;
}

/** Count jobs by status for pipeline-status. */
export async function getDistributionJobCounts(env) {
  const base = supabaseBase(env);
  const h = { ...supabaseHeaders(env), Prefer: 'count=exact' };
  const counts = { pending: 0, failed: 0, sent: 0 };

  for (const status of ['pending', 'failed', 'sent']) {
    try {
      const res = await fetch(`${base}/distribution_jobs?status=eq.${status}&select=id`, { headers: h });
      counts[status] = parseInt(res.headers.get('content-range')?.split('/')[1] || '0', 10);
    } catch { /* non-fatal */ }
  }

  return counts;
}

/** Backfill jobs — batched to stay within Worker subrequest limits (free tier ~50). */
export async function backfillDistributionJobs(env, { limit = 40, skipSetupCheck = false } = {}) {
  if (!skipSetupCheck) {
    const setup = await checkDistributionSetup(env);
    if (!setup.ready) {
      return {
        enqueued: 0,
        migrationRequired: true,
        error: 'distribution_jobs table missing — run supabase/migrations/20260621180000_distribution_jobs.sql in Supabase SQL Editor',
        setup,
      };
    }
  }

  const cappedLimit = Math.min(Math.max(limit, 1), 60);
  const settings = await loadSiteSettings(env);
  const { articles, error } = await fetchPublishedArticles(env, cappedLimit, settings);
  if (error) return { enqueued: 0, error };

  const allRows = [];
  for (const article of articles) {
    allRows.push(...buildJobRowsForArticle(article, settings, env));
  }

  const result = await bulkInsertJobs(env, allRows);
  return {
    ...result,
    scanned: articles.length,
    jobRowsBuilt: allRows.length,
  };
}

/** Retry a failed job from admin. */
export async function retryDistributionJob(env, jobId) {
  await patchJob(env, jobId, {
    status: 'pending',
    attempts: 0,
    last_error: null,
    next_retry_at: new Date().toISOString(),
  });
  return { ok: true };
}

export { jobBatch, BACKOFF_MINUTES };

/** Switch Facebook to dlvr.it — disable Graph API and cancel queued Worker Facebook jobs. */
export async function enableDlvrItFacebookMode(env) {
  const current = (await getSiteSettingsRow(env)) || {};
  const merged = mergeSiteSettings(current);
  merged.integrations = merged.integrations || {};
  merged.integrations.facebook = {
    ...merged.integrations.facebook,
    graphApiEnabled: false,
    dlvrItFeedUrl: merged.integrations.facebook?.dlvrItFeedUrl
      || 'https://www.thebharathnews.com/feed.xml?lang=ml',
  };

  const patchRes = await fetch(`${supabaseBase(env)}/site_settings?key=eq.site`, {
    method: 'PATCH',
    headers: headers(env, 'return=minimal'),
    body: JSON.stringify({ value: merged }),
  });

  if (!patchRes.ok) {
    const insertRes = await fetch(`${supabaseBase(env)}/site_settings`, {
      method: 'POST',
      headers: headers(env, 'resolution=merge-duplicates,return=minimal'),
      body: JSON.stringify({ key: 'site', value: merged }),
    });
    if (!insertRes.ok) {
      return { ok: false, error: `site_settings update failed: ${patchRes.status}` };
    }
  }

  let skipped = 0;
  for (const status of ['pending', 'processing', 'failed']) {
    const res = await fetch(
      `${supabaseBase(env)}/distribution_jobs?channel=eq.facebook&status=eq.${status}`,
      {
        method: 'PATCH',
        headers: headers(env, 'return=representation'),
        body: JSON.stringify({
          status: 'skipped',
          last_error: 'dlvr_it_mode — Facebook handled via RSS/dlvr.it',
          updated_at: new Date().toISOString(),
        }),
      }
    );
    if (res.ok) {
      const rows = await res.json();
      skipped += Array.isArray(rows) ? rows.length : 0;
    }
  }

  return {
    ok: true,
    graphApiEnabled: false,
    dlvrItFeedUrl: merged.integrations.facebook.dlvrItFeedUrl,
    facebookJobsSkipped: skipped,
  };
}
