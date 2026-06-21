/**
 * Backfill distribution jobs + process queue (batched for Cloudflare free tier).
 * Usage: npm run backfill:distribution
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER = process.env.NEXT_PUBLIC_WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev';

async function main() {
  console.log('Checking distribution setup...');
  const setupRes = await fetch(`${WORKER}/api/distribution-setup?k=run7x9k`);
  const setupData = await setupRes.json();
  console.log('Setup:', setupData.setup, setupData.hint || '');

  if (setupData.setup?.migrationRequired) {
    console.log('\n⚠️  MIGRATION REQUIRED');
    console.log('Open Supabase Dashboard → SQL Editor and run:');
    console.log('  supabase/migrations/20260621180000_distribution_jobs.sql\n');
    try {
      const sql = readFileSync(
        join(__dirname, '../supabase/migrations/20260621180000_distribution_jobs.sql'),
        'utf8'
      );
      console.log('--- SQL (copy/paste) ---\n');
      console.log(sql);
      console.log('--- end SQL ---\n');
    } catch { /* optional */ }
    process.exit(1);
  }

  console.log('Backfilling distribution jobs (batched, 40 articles per Worker call)...');
  let totalEnqueued = 0;
  let batch = 0;

  while (batch < 50) {
    batch++;
    const skipSetup = batch > 1 ? '&skipSetup=1' : '';
    const res = await fetch(`${WORKER}/api/backfill-distribution-jobs?k=run7x9k&limit=40${skipSetup}`);
    const data = await res.json();

    if (data.error) {
      console.error('Backfill error:', data.error);
      process.exit(1);
    }

    totalEnqueued += data.enqueued || 0;
    console.log(`Batch ${batch}: scanned=${data.scanned} jobs=${data.jobRowsBuilt} inserted=${data.enqueued}`);

    if (!data.scanned || data.jobRowsBuilt === 0) break;
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\nBackfill complete: ${totalEnqueued} jobs queued.\nProcessing queue...`);

  let totalTg = 0;
  let totalFb = 0;
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${WORKER}/api/distribute-now?k=run7x9k&telegram=3&facebook=0`);
    const data = await res.json();
    if (!res.ok) {
      console.error('Process failed:', data);
      break;
    }
    totalTg += data.telegramSent || 0;
    totalFb += data.facebookSent || 0;
    console.log(`Round ${i + 1}: tg=${data.telegramSent} fb=${data.facebookSent} failed=${data.failed || 0}`);
    if ((data.telegramSent || 0) === 0 && (data.facebookSent || 0) === 0) break;
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log(`Done: ${totalEnqueued} jobs queued, ${totalTg} Telegram + ${totalFb} Facebook sent.`);
}

main().catch(err => { console.error(err); process.exit(1); });
