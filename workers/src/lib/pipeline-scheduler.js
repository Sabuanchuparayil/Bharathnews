import { handleFastPublish } from '../handlers/fast-publish.js';
import { handleEnglishIngestCron, handleRegionalIngestCron, handleIngestLang } from '../handlers/ingest-lang.js';
import { handleRSSIngest } from '../handlers/rss-ingest.js';
import { loadSiteSettings } from './sources-loader.js';
import { getLimits, getCronPublishOpts } from './cf-limits.js';
import { processDistributionJobs, backfillDistributionJobs } from './distribution-jobs.js';
import { REGIONAL_LANGUAGES } from './regional-feeds.js';

/** Phase 3 — publish only (no ingest, no social inline). */
export async function runPublishOnlyTick(env) {
  console.log(`[cron] publish-only at ${new Date().toISOString()} tier=${getLimits(env).TIER}`);
  try {
    const published = await handleFastPublish(env, getCronPublishOpts(env));
    console.log('[cron] publish-only done:', published);
    return { stage: 'publish-only', result: published };
  } catch (err) {
    console.error('[cron] publish-only failed:', err.message);
    throw err;
  }
}

/** Phase 3 — dedicated distribution job processor (runs on offset cron). */
export async function runDistributionJobsTick(env, options = {}) {
  console.log(`[cron] distribution-jobs at ${new Date().toISOString()}`);
  try {
    const result = await processDistributionJobs(env, options);
    console.log('[cron] distribution-jobs done:', result);
    return { stage: 'distribution-jobs', result };
  } catch (err) {
    console.error('[cron] distribution-jobs failed:', err.message);
    throw err;
  }
}

/** Phase 3 — ingest only: English + 2 rotating regional langs (no publish). */
export async function runIngestTick(env) {
  const L = getLimits(env);
  const tick = Math.floor(Date.now() / (10 * 60 * 1000));
  console.log(`[cron] ingest at ${new Date().toISOString()} tick=${tick} tier=${L.TIER}`);

  const summary = {
    tick,
    englishIngested: 0,
    regionalIngested: 0,
    mixedIngested: 0,
    ingestErrors: [],
  };

  try {
    const english = await handleEnglishIngestCron(env);
    summary.englishIngested = english.ingested || 0;
  } catch (err) {
    summary.ingestErrors.push({ stage: 'english', error: err.message });
  }

  try {
    const regional = await handleRegionalIngestCron(env, { skipPublish: true });
    summary.regionalIngested = regional.totalIngested || 0;
  } catch (err) {
    summary.ingestErrors.push({ stage: 'regional', error: err.message });
  }

  if (tick % 3 === 0) {
    try {
      const mixed = await handleRSSIngest(env);
      summary.mixedIngested = Array.isArray(mixed) ? mixed.length : 0;
    } catch (err) {
      summary.ingestErrors.push({ stage: 'mixed-rss', error: err.message });
    }
  }

  console.log('[cron] ingest done:', summary);
  return { stage: 'ingest', result: summary };
}

/** Phase 3 — one language per tick for even regional coverage (~35 min cycle). */
export async function runSingleLangIngestTick(env) {
  const tick = Math.floor(Date.now() / (5 * 60 * 1000));
  const allLangs = ['en', ...REGIONAL_LANGUAGES];
  const lang = allLangs[tick % allLangs.length];
  const L = getLimits(env);

  console.log(`[cron] single-lang ingest: ${lang} tick=${tick}`);

  try {
    const result = await handleIngestLang(env, {
      lang,
      maxSources: lang === 'en' ? L.ENGLISH_SOURCES_PER_TICK : 1,
      itemsPerSource: L.ITEMS_PER_SOURCE,
      publish: false,
    });
    console.log(`[cron] single-lang ${lang} done:`, result);
    return { stage: 'single-lang-ingest', lang, result };
  } catch (err) {
    console.error(`[cron] single-lang ${lang} failed:`, err.message);
    return { stage: 'single-lang-ingest', lang, error: err.message };
  }
}

/** Legacy combined tick — kept for manual /api/bulk-fill triggers. */
export async function runTenMinuteTick(env) {
  const published = await runPublishOnlyTick(env);
  const ingest = await runIngestTick(env);
  const distribute = await runDistributionJobsTick(env);
  return {
    stage: 'ten-minute-legacy',
    result: { published, ingest, distribute },
  };
}

/** Legacy fast pipeline — manual triggers only. */
export async function runScheduledPipeline(env) {
  console.log(`[cron] fast pipeline at ${new Date().toISOString()}`);
  const ingested = await handleRSSIngest(env);
  const published = await handleFastPublish(env, getCronPublishOpts(env));
  const distribute = await processDistributionJobs(env, { telegramBatch: 3, facebookBatch: 2 });
  return {
    stage: 'fast',
    result: {
      ingested: Array.isArray(ingested) ? ingested.length : 0,
      ...published,
      distribute,
    },
  };
}

export { backfillDistributionJobs, processDistributionJobs as runSocialDistributionTick };
