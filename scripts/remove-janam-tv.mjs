/**
 * Remove all Janam TV content and disable Janam TV sources.
 * Usage: npm run remove:janam-tv
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq <= 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnv();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set Supabase env vars in .env.local');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function count(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=id`, {
    headers: { ...headers, Prefer: 'count=exact' },
  });
  const range = res.headers.get('content-range') || '';
  const total = range.split('/')[1];
  return parseInt(total || '0', 10);
}

async function del(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status} ${await res.text()}`);
}

async function patchSources() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sources?or=(name.ilike.*Janam*,url.ilike.*janamtv*)`, {
    headers,
  });
  const rows = await res.json();
  for (const row of rows || []) {
    await fetch(`${SUPABASE_URL}/rest/v1/sources?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ enabled: false }),
    });
  }
  return rows?.length || 0;
}

async function main() {
  const articleFilter = 'or=(source.ilike.*Janam*,source_url.ilike.*janamtv*)';
  const rawFilter = 'or=(source.ilike.*Janam*,source_url.ilike.*janamtv*)';

  const beforeArticles = await count('articles', articleFilter);
  const beforeRaw = await count('raw_articles', rawFilter);

  console.log(`Found: ${beforeArticles} published articles, ${beforeRaw} raw articles from Janam TV`);

  if (beforeArticles) await del('articles', articleFilter);
  if (beforeRaw) await del('raw_articles', rawFilter);

  const sourcesDisabled = await patchSources();

  console.log(`Removed ${beforeArticles} articles, ${beforeRaw} raw rows`);
  console.log(`Disabled ${sourcesDisabled} Janam TV source(s)`);
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
