/**
 * Bulk-fill regional-language articles from REGIONAL_RSS_SOURCES only.
 * Usage: npm run fill:regional
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { REGIONAL_RSS_SOURCES } from '../workers/src/lib/regional-feeds.js';
import { resolveBestArticleImage } from '../src/utils/articleImages.js';

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
const ITEMS_PER_SOURCE = parseInt(process.env.REGIONAL_FILL_ITEMS || '12', 10);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  Prefer: 'resolution=merge-duplicates,return=minimal',
};

function slugify(title) {
  return (title || '')
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `article-${Date.now().toString(36)}`;
}

function stripHtml(text) {
  return (text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function safeDate(value) {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function parseRss(url) {
  try {
    const isGN = url.includes('news.google.com/') || url.includes('oneindia.com/');
    if (isGN) {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (data.status !== 'ok') return [];
      return (data.items || []).map(item => ({
        title: item.title,
        link: item.link,
        description: stripHtml(item.description || item.title),
        pubDate: item.pubDate,
        imageUrl: item.thumbnail || item.enclosure?.link || '',
      })).filter(i => i.title && i.link);
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheBharathNews/2.0 RSS Bot' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    const items = [];
    for (const block of blocks.slice(0, ITEMS_PER_SOURCE + 4)) {
      const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.replace(/<[^>]+>/g, '').trim();
      const link = (block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || [])[1]?.trim()
        || (block.match(/<link[^>]+href="([^"]+)"/i) || [])[1]?.trim();
      const desc = (block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)
        || block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) || [])[1]?.replace(/<[^>]+>/g, ' ').trim();
      const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1]?.trim()
        || (block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) || [])[1]?.trim();
      if (title && link) {
        items.push({ title, link, description: desc || title, pubDate, imageUrl: '' });
      }
    }
    return items;
  } catch {
    return [];
  }
}

async function upsertArticle(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?on_conflict=slug`, {
    method: 'POST',
    headers,
    body: JSON.stringify(row),
  });
  return res.ok;
}

async function main() {
  console.log(`Filling regional news from ${REGIONAL_RSS_SOURCES.length} sources (${ITEMS_PER_SOURCE} items each)...`);
  let published = 0;
  let failed = 0;

  for (const src of REGIONAL_RSS_SOURCES) {
    const items = await parseRss(src.url);
    let count = 0;

    for (const item of items.slice(0, ITEMS_PER_SOURCE)) {
      const slug = slugify(item.title);
      const description = stripHtml(item.description);
      const imageUrl = await resolveBestArticleImage({
        imageUrl: item.imageUrl,
        sourceUrl: item.link,
        category: src.category || 'india',
        slug,
        title: item.title,
      });

      const ok = await upsertArticle({
        slug,
        title: item.title.slice(0, 500),
        summary: description.slice(0, 300) || item.title.slice(0, 300),
        full_content: description || item.title,
        image_url: imageUrl,
        category: src.category || 'india',
        region: src.region || 'india',
        language: src.language || 'en',
        source: src.name,
        source_url: item.link,
        author: 'The Bharath News',
        score: 7,
        quality_score: 7,
        editorial_status: 'published',
        topics: [src.category || 'india'],
        translations: {},
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        published_at: safeDate(item.pubDate),
        distributed: { telegram: false, facebook: false, whatsapp: false },
      });
      if (ok) { published++; count++; }
      else failed++;
    }
    console.log(`  [${src.language}] ${src.name}: ${count} articles`);
  }

  console.log(`\nDone: ${published} regional articles published, ${failed} failed.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
