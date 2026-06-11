/**
 * Run ingest → classify → process in a loop until a target number of articles are published.
 *
 * Usage:
 *   node scripts/bulk-publish.mjs [target=40] [maxRounds=30]
 *
 * Example (publish ~40 articles):
 *   node scripts/bulk-publish.mjs 40
 */

const WORKER_URL = (process.env.WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev').replace(/\/$/, '');
const TARGET = Math.max(1, parseInt(process.argv[2] || process.env.TARGET || '40', 10));
const MAX_ROUNDS = Math.max(1, parseInt(process.argv[3] || process.env.MAX_ROUNDS || '30', 10));
const DELAY_MS = 3000;

const TIMEOUTS_MS = {
  '/api/ingest': 45_000,
  '/api/classify': 90_000,
  '/api/process': 180_000,
};

async function post(path) {
  const timeoutMs = TIMEOUTS_MS[path] || 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${WORKER_URL}${path}`, { method: 'POST', signal: controller.signal });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }
    if (!res.ok) throw new Error(`${path} (${res.status}): ${JSON.stringify(body)}`);
    return body;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`${path} timed out after ${timeoutMs / 1000}s`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`Bulk publish → target ${TARGET} articles (max ${MAX_ROUNDS} rounds)`);
  console.log(`Worker: ${WORKER_URL}\n`);

  let published = 0;

  for (let round = 1; round <= MAX_ROUNDS && published < TARGET; round++) {
    console.log(`--- Round ${round}/${MAX_ROUNDS} (published so far: ${published}/${TARGET}) ---`);

    try {
      const ingest = await post('/api/ingest');
      console.log('Ingest:', ingest);
    } catch (err) {
      console.warn('Ingest skipped:', err.message);
    }

    let classified = 0;
    for (let c = 0; c < 3; c++) {
      try {
        const result = await post('/api/classify');
        classified += result.classified || 0;
        console.log(`Classify ${c + 1}/3:`, result);
      } catch (err) {
        console.warn(`Classify ${c + 1} failed:`, err.message);
      }
    }

    for (let p = 0; p < 2 && published < TARGET; p++) {
      try {
        console.log(`Process ${p + 1}/2 (Llama — may take 1–3 min)...`);
        const result = await post('/api/process');
        const count = result.processed || 0;
        published += count;
        console.log(`Process ${p + 1}/2:`, result, `| total published: ${published}`);
      } catch (err) {
        console.warn(`Process ${p + 1} failed:`, err.message);
      }
    }

    if (published >= TARGET) break;
    if (round < MAX_ROUNDS) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nFinished. Published ${published} article(s) this run (target was ${TARGET}).`);
  if (published < TARGET) {
    console.log('Cron (every 15 min) will continue. Re-run this script or wait for more RSS items to ingest.');
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
