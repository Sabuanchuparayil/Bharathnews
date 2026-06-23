/**
 * Backfill article thumbnails — fix duplicates and generic publisher images.
 * Usage: npm run fix:images
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  resolveBestArticleImage,
  shouldReplaceImage,
  isStoredPlaceholderImage,
} from '../src/utils/articleImages.js';

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

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set Supabase env vars in .env.local');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

async function fetchAllArticles() {
  const all = [];
  for (let offset = 0; offset < 600; offset += 100) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=slug,title,category,image_url,source_url&editorial_status=eq.published&order=published_at.desc&limit=100&offset=${offset}`,
      { headers }
    );
    const batch = await res.json();
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

async function patchImage(slug, imageUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?slug=eq.${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ image_url: imageUrl }),
  });
  return res.ok;
}

async function processBatch(articles, concurrency = 6) {
  let updated = 0;
  let real = 0;
  let cleared = 0;

  for (let i = 0; i < articles.length; i += concurrency) {
    const batch = articles.slice(i, i + concurrency);
    await Promise.all(batch.map(async (article) => {
      const best = await resolveBestArticleImage({
        imageUrl: article.image_url,
        sourceUrl: article.source_url,
        category: article.category,
        slug: article.slug,
        title: article.title,
      });

      if (best === article.image_url) return;

      if (best && !isStoredPlaceholderImage(best)) real++;
      else if (!best) cleared++;

      const ok = await patchImage(article.slug, best || null);
      if (ok) updated++;
    }));
    process.stdout.write(`  Fixed ${Math.min(i + concurrency, articles.length)}/${articles.length}\r`);
  }

  return { updated, real, cleared };
}

async function main() {
  console.log('Loading all published articles...');
  const all = await fetchAllArticles();

  const counts = {};
  for (const a of all) {
    const u = a.image_url || '';
    counts[u] = (counts[u] || 0) + 1;
  }

  const needsFix = all.filter(a => shouldReplaceImage(a.image_url, counts[a.image_url] || 1));
  console.log(`Total: ${all.length} | Unique images: ${Object.keys(counts).length} | Need fix: ${needsFix.length}`);

  if (!needsFix.length) {
    console.log('All images look good.');
    return;
  }

  const result = await processBatch(needsFix);
  console.log(`\nDone: ${result.updated} updated (${result.real} source images, ${result.cleared} placeholders cleared)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
