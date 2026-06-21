/**
 * Seed RSS / YouTube sources into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-sources-supabase.mjs
 *
 * Or set vars in .env.local and run: npm run seed:sources
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RSS_FEEDS, GOOGLE_NEWS_TOPIC_FEEDS, YOUTUBE_CHANNELS } from '../src/config/feeds.config.js';
import { REGIONAL_RSS_SOURCES } from '../workers/src/lib/regional-feeds.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(join(ROOT, '.env.local'));
loadEnvFile(join(ROOT, '.env'));

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or add to .env.local)');
  process.exit(1);
}

function slugify(str, suffix = '') {
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  return suffix ? `${base}-${suffix}` : base;
}

function normalizeSource(src, type) {
  const id = src.id || slugify(src.name, type === 'youtube' ? 'yt' : type === 'googlenews' ? 'gn' : '');
  return {
    id,
    name: src.name,
    url: src.url,
    type: type || src.type || 'rss',
    category: src.category || 'india',
    subcategory: src.subcategory || null,
    region: src.region || 'india',
    language: src.language || 'en',
    enabled: src.enabled !== false,
    trust_weight: src.trustWeight ?? 0.85,
    item_count: 0,
  };
}

const sources = [
  ...RSS_FEEDS.map(f => normalizeSource(f, f.url?.includes('news.google.com') ? 'googlenews' : 'rss')),
  ...GOOGLE_NEWS_TOPIC_FEEDS.map(f => normalizeSource(f, 'googlenews')),
  ...REGIONAL_RSS_SOURCES.map(f => normalizeSource(f, f.type || 'rss')),
  ...YOUTUBE_CHANNELS.map(c => normalizeSource({
    name: c.name,
    url: `https://www.youtube.com/feeds/videos.xml?channel_id=${c.channelId}`,
    category: c.category,
    region: c.region || 'india',
    language: c.language,
  }, 'youtube')),
];

let omitSubcategoryColumn = false;

async function upsertSource(row) {
  const payload = omitSubcategoryColumn
    ? (({ subcategory, ...rest }) => rest)(row)
    : row;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/sources?on_conflict=id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    if (!omitSubcategoryColumn && err.includes("'subcategory' column")) {
      omitSubcategoryColumn = true;
      console.warn('sources.subcategory column missing — re-run supabase/migrations/20260621_sources_subcategory.sql to enable it. Seeding without subcategory for now.');
      return upsertSource(row);
    }
    throw new Error(`Upsert ${row.id} failed: ${err.slice(0, 200)}`);
  }
}

async function seedSiteSettings() {
  const defaults = {
    pipeline: {
      rssIngestEnabled: true,
      classifyEnabled: true,
      aiProcessEnabled: true,
      videoFetchEnabled: true,
      newsletterEnabled: false,
    },
    targetLanguages: ['ml', 'hi', 'ar'],
    qualityThreshold: 6,
    telegram: { enabled: true, minScore: 6 },
    email: { enabled: false },
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?on_conflict=key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ key: 'site', value: defaults }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn('Site settings seed warning:', err.slice(0, 200));
  }
}

async function main() {
  console.log(`Seeding ${sources.length} sources to Supabase...`);
  let ok = 0;
  for (const src of sources) {
    try {
      await upsertSource(src);
      ok++;
    } catch (err) {
      console.error(err.message);
    }
  }
  await seedSiteSettings();
  console.log(`Done: ${ok}/${sources.length} sources upserted.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
