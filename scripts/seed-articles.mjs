/**
 * Trigger multiple ingest → classify → process cycles on the Cloudflare Worker.
 * Usage: node scripts/seed-articles.mjs [worker-url] [cycles]
 *
 * Default worker: https://bharathnews-api.bharathnewsweb.workers.dev
 * Default cycles: 3
 *
 * Note: /api/process runs Llama AI (multilingual) and can take 1–3 minutes per call.
 */

const WORKER_URL = (process.argv[2] || process.env.WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev').replace(/\/$/, '');
const CYCLES = Math.max(1, parseInt(process.argv[3] || process.env.SEED_CYCLES || '3', 10));
const DELAY_MS = 5000;

const TIMEOUTS_MS = {
  '/api/ingest': 45_000,
  '/api/classify': 60_000,
  '/api/process': 180_000,
};

async function post(path, retries = 3) {
  const timeoutMs = TIMEOUTS_MS[path] || 60_000;
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (path === '/api/process') {
        console.log(`  (process can take up to ${timeoutMs / 1000}s — Llama AI is slow)`);
      }
      const res = await fetch(`${WORKER_URL}${path}`, {
        method: 'POST',
        signal: controller.signal,
      });
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text.slice(0, 200) };
      }
      if (!res.ok) {
        throw new Error(`${path} failed (${res.status}): ${JSON.stringify(body)}`);
      }
      return body;
    } catch (err) {
      lastErr = err.name === 'AbortError'
        ? new Error(`${path} timed out after ${timeoutMs / 1000}s`)
        : err;
      if (attempt < retries) {
        console.warn(`${path} attempt ${attempt} failed, retrying...`);
        await new Promise(r => setTimeout(r, 3000));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

async function runCycle(cycle) {
  console.log(`\n--- Cycle ${cycle}/${CYCLES} ---`);
  const ingest = await post('/api/ingest');
  console.log('Ingest:', ingest);

  const classify = await post('/api/classify');
  console.log('Classify:', classify);

  const process = await post('/api/process');
  console.log('Process:', process);

  return { ingest, classify, process };
}

async function main() {
  console.log(`Worker: ${WORKER_URL}`);
  console.log(`Running ${CYCLES} pipeline cycle(s)...`);

  for (let i = 1; i <= CYCLES; i++) {
    await runCycle(i);
    if (i < CYCLES) {
      console.log(`Waiting ${DELAY_MS / 1000}s before next cycle...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log('\nDone. Cron will keep processing every 15 min. Check category pages shortly.');
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
