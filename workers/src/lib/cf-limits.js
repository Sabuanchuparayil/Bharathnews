/**
 * Cloudflare Worker pipeline capacity — tiered limits.
 *
 * FREE (default): 45 subrequest budget — safe on Workers Free (50 max).
 * PAID:           ~150 subrequest budget — enable after upgrading to Workers Paid
 *                 and traffic grows. Set PIPELINE_TIER=paid in wrangler.toml and
 *                 uncomment [limits] subrequests there, then redeploy.
 *
 * Upgrade checklist (when ready):
 *   1. Upgrade Cloudflare account to Workers Paid ($5/mo)
 *   2. wrangler.toml → PIPELINE_TIER = "paid"
 *   3. wrangler.toml → uncomment [limits] subrequests = 200
 *   4. cd workers && npx wrangler deploy
 *   5. Verify: /api/pipeline-status?k=run7x9k shows tier:"paid"
 *
 * @see https://developers.cloudflare.com/workers/platform/limits/
 */

/** Workers Free — current production defaults. */
export const FREE_LIMITS = {
  TIER: 'free',
  SUBREQUEST_BUDGET: 45,
  MAX_PARALLEL_FETCHES: 1,

  PUBLISH_BATCH_SIZE: 6,
  PUBLISH_MAX_ROUNDS: 1,
  BACKLOG_FLUSH_MAX_ROUNDS: 3,
  BACKLOG_BATCH_SIZE: 4,

  ITEMS_PER_SOURCE: 2,
  FEED_SCAN_DEPTH: 6,

  ENGLISH_SOURCES_PER_TICK: 1,
  REGIONAL_LANGS_PER_TICK: 2,
  REGIONAL_SOURCES_WHEN_MANY_LANGS: 1,
  REGIONAL_SOURCES_DEFAULT: 1,
  MIXED_RSS_SOURCES: 2,

  API_INGEST_SOURCES: 1,
  API_INGEST_ITEMS: 2,
  API_PUBLISH_BATCH: 4,
  API_PUBLISH_ROUNDS: 1,

  /** YouTube sync — kept small to stay within 45 subrequest budget on Free. */
  VIDEO_CHANNELS_PER_RUN: 3,
  VIDEO_ITEMS_PER_CHANNEL: 5,
};

/** Workers Paid — enable via PIPELINE_TIER=paid after traffic grows. */
export const PAID_LIMITS = {
  TIER: 'paid',
  SUBREQUEST_BUDGET: 180,
  MAX_PARALLEL_FETCHES: 2,

  PUBLISH_BATCH_SIZE: 12,
  PUBLISH_MAX_ROUNDS: 2,
  BACKLOG_FLUSH_MAX_ROUNDS: 6,
  BACKLOG_BATCH_SIZE: 8,

  ITEMS_PER_SOURCE: 3,
  FEED_SCAN_DEPTH: 10,

  ENGLISH_SOURCES_PER_TICK: 2,
  REGIONAL_LANGS_PER_TICK: 3,
  REGIONAL_SOURCES_WHEN_MANY_LANGS: 2,
  REGIONAL_SOURCES_DEFAULT: 2,
  MIXED_RSS_SOURCES: 4,

  API_INGEST_SOURCES: 2,
  API_INGEST_ITEMS: 3,
  API_PUBLISH_BATCH: 8,
  API_PUBLISH_ROUNDS: 2,

  VIDEO_CHANNELS_PER_RUN: 8,
  VIDEO_ITEMS_PER_CHANNEL: 8,
};

/** @deprecated Use getLimits(env) — kept for static imports during migration. */
export const CF_LIMITS = FREE_LIMITS;

export function getLimits(env) {
  const tier = (env?.PIPELINE_TIER || 'free').toLowerCase();
  return tier === 'paid' ? PAID_LIMITS : FREE_LIMITS;
}

export function getCronPublishOpts(env) {
  const L = getLimits(env);
  return {
    skipImageResolve: true,
    skipDistribution: true,
    batchSize: L.PUBLISH_BATCH_SIZE,
    maxRounds: L.PUBLISH_MAX_ROUNDS,
  };
}

/** @deprecated Use getCronPublishOpts(env) */
export const CRON_PUBLISH_OPTS = {
  skipImageResolve: true,
  skipDistribution: true,
  batchSize: FREE_LIMITS.PUBLISH_BATCH_SIZE,
  maxRounds: FREE_LIMITS.PUBLISH_MAX_ROUNDS,
};

export function pickLangSlice(allLangs, tick, count) {
  if (!allLangs?.length) return [];
  const n = count ?? FREE_LIMITS.REGIONAL_LANGS_PER_TICK;
  const start = tick % allLangs.length;
  const out = [];
  for (let i = 0; i < Math.min(n, allLangs.length); i++) {
    out.push(allLangs[(start + i) % allLangs.length]);
  }
  return out;
}
