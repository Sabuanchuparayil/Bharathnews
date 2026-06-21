/**
 * Apply distribution_jobs migration via Supabase REST (run once).
 * Usage: node scripts/run-migration-distribution.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sql = readFileSync(
  join(__dirname, '../supabase/migrations/20260621180000_distribution_jobs.sql'),
  'utf8'
);

// Supabase SQL API via pg — use rpc or direct postgres. Fallback: run statements individually via REST where possible.

async function runViaPg() {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (res.ok) return true;
  return false;
}

async function checkTable() {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/distribution_jobs?select=id&limit=1`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  return res.status !== 404 && res.status !== 406;
}

async function main() {
  if (await checkTable()) {
    console.log('distribution_jobs table already exists — skipping migration.');
    return;
  }

  console.log('Apply migration in Supabase Dashboard → SQL Editor:');
  console.log('  supabase/migrations/20260621180000_distribution_jobs.sql');
  console.log('');
  console.log('Or paste this URL in browser SQL editor for project ectcwkpwhfmzpgmpwjwm');
  console.log('Migration file path:', join(__dirname, '../supabase/migrations/20260621180000_distribution_jobs.sql'));

  const tried = await runViaPg();
  if (tried) {
    console.log('Migration applied via RPC.');
    return;
  }

  console.log('\nCould not auto-apply — please run SQL manually in Supabase dashboard.');
}

main().catch(err => { console.error(err); process.exit(1); });
