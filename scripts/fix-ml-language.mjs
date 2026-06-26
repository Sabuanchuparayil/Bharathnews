#!/usr/bin/env node
/**
 * Fix articles wrongly tagged as language='ml' but containing only English text.
 * - Checks titles for Malayalam Unicode characters (U+0D00–U+0D7F)
 * - Re-tags English-only articles to language='en'
 * - Also cleans raw_articles table
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

const ML_RE = /[\u0D00-\u0D7F]/;

function isMalayalam(title) {
  return ML_RE.test(title || '');
}

async function fixTable(table) {
  console.log(`\n--- Scanning ${table} (language=ml) ---`);
  const pkField = table === 'raw_articles' ? 'slug' : 'id';
  const url = `${SUPABASE_URL}/rest/v1/${table}?language=eq.ml&select=${pkField},title,slug&limit=500`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`  Failed to fetch ${table}:`, res.status, await res.text());
    return { fixed: 0, kept: 0 };
  }

  const rows = await res.json();
  console.log(`  Found ${rows.length} rows tagged as ml`);

  let fixed = 0;
  let kept = 0;
  const toFix = [];

  for (const row of rows) {
    if (isMalayalam(row.title)) {
      kept++;
    } else {
      toFix.push(row);
    }
  }

  console.log(`  Actually Malayalam: ${kept}`);
  console.log(`  English (fixing): ${toFix.length}`);

  for (const row of toFix) {
    const pk = row[pkField];
    const patchUrl = `${SUPABASE_URL}/rest/v1/${table}?${pkField}=eq.${encodeURIComponent(pk)}`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ language: 'en' }),
    });
    if (patchRes.ok) {
      fixed++;
    } else {
      console.error(`  Failed to fix ${row.slug}:`, patchRes.status);
    }
  }

  console.log(`  Fixed: ${fixed} rows → language='en'`);
  return { fixed, kept };
}

async function main() {
  console.log('=== Fixing wrongly-tagged Malayalam articles ===');
  console.log(`DB: ${SUPABASE_URL}`);

  const artResult = await fixTable('articles');
  const rawResult = await fixTable('raw_articles');

  console.log('\n=== Summary ===');
  console.log(`articles: ${artResult.fixed} fixed, ${artResult.kept} kept as ml`);
  console.log(`raw_articles: ${rawResult.fixed} fixed, ${rawResult.kept} kept as ml`);
  console.log('\nDone! The social-ml.xml feed will now only show actual Malayalam articles.');
}

main().catch(e => { console.error(e); process.exit(1); });
