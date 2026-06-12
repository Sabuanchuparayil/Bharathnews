import { handleRSSIngest } from '../handlers/rss-ingest.js';
import { handleClassify } from '../handlers/classify.js';
import { handleAIProcess } from '../handlers/ai-process.js';
import { handleVideoFetch } from '../handlers/video-fetch.js';

/**
 * Cloudflare Workers free tier: 50 subrequests per invocation.
 * Run exactly ONE pipeline stage every 15 minutes so each stage stays within budget
 * and posting (process) is never blocked by running ingest/classify in the same tick.
 *
 * 6-slot cycle (90 min): ingest → classify → process → ingest → classify → process
 * Publishes up to ~10 articles/90 min (5 per process run, twice per cycle).
 * Video fetch runs every 6 hours on the first ingest slot (65% regional channels).
 *
 * RSS ingest and video fetch both apply 65% regional source weighting.
 */
export async function runScheduledPipeline(env) {
  const tick = Math.floor(Date.now() / (15 * 60 * 1000));
  const slot = tick % 6;
  const stages = [
    ['ingest', () => handleRSSIngest(env)],
    ['classify', () => handleClassify(env)],
    ['process', () => handleAIProcess(env)],
    ['ingest', () => handleRSSIngest(env)],
    ['classify', () => handleClassify(env)],
    ['process', () => handleAIProcess(env)],
  ];
  const [name, run] = stages[slot];

  console.log(`[cron] slot ${slot}/5 → "${name}" at ${new Date().toISOString()}`);

  try {
    if (name === 'ingest' && tick % 24 === 0) {
      console.log('[cron] scheduled video fetch (every 6h, 65% regional)');
      await handleVideoFetch(env).catch(err => console.error('[cron] video failed:', err.message));
    }
    const result = await run();
    const summary = Array.isArray(result)
      ? result.length
      : (result && typeof result === 'object' ? result : result);
    console.log(`[cron] "${name}" done:`, summary);
    return { stage: name, slot, result: summary };
  } catch (err) {
    console.error(`[cron] "${name}" failed:`, err.message);
    throw err;
  }
}
