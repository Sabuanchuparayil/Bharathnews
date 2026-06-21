/**
 * Verify regional news + videos in Supabase and production site.
 * Usage: node scripts/verify-content.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

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
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thebharathnews.com').replace(/\/$/, '');

const headers = { apikey: ANON, Authorization: `Bearer ${ANON}` };

function countFromRange(res) {
  const range = res.headers.get('content-range') || '';
  return parseInt(range.split('/')[1], 10) || 0;
}

async function supabaseCount(table, filters = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id${filters}`, {
    headers: { ...headers, Prefer: 'count=exact' },
  });
  return countFromRange(res);
}

async function supabaseSelect(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

function tally(rows, key) {
  const m = {};
  for (const r of rows) {
    const k = r[key] || '?';
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

async function checkPage(path) {
  const url = `${SITE}${path}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'BharathNews-Verify/1.0' } });
  const html = await res.text();
  return {
    path,
    status: res.status,
    hasArticleLinks: (html.match(/\/article\//g) || []).length,
    hasVideoEmbed: html.includes('youtube.com/embed') || html.includes('Watch on YouTube'),
    isEmpty: /No videos yet|No articles found|Nothing here yet/i.test(html),
    bytes: html.length,
  };
}

async function main() {
  console.log('=== SUPABASE CONTENT ===\n');

  const articleCount = await supabaseCount('articles');
  const videoCount = await supabaseCount('videos');
  const sourceCount = await supabaseCount('sources', '&enabled=eq.true');

  console.log(`Articles:        ${articleCount}`);
  console.log(`Videos:          ${videoCount}`);
  console.log(`Enabled sources: ${sourceCount}`);

  const articles = await supabaseSelect('articles?select=category,language,editorial_status&limit=1000');
  console.log('\nArticles by category:', tally(articles, 'category'));
  console.log('Articles by language:', tally(articles, 'language'));

  const videos = await supabaseSelect('videos?select=language,channel&limit=300');
  console.log('\nVideos by language:', tally(videos, 'language'));

  const sources = await supabaseSelect('sources?enabled=eq.true&select=type,language&limit=200');
  console.log('Sources by type:    ', tally(sources, 'type'));

  const recentArticles = await supabaseSelect('articles?select=title,category,language,published_at&order=published_at.desc&limit=3');
  console.log('\nRecent articles:');
  for (const a of recentArticles) {
    console.log(`  [${a.language}/${a.category}] ${(a.title || '').slice(0, 70)}`);
  }

  const recentVideos = await supabaseSelect('videos?select=title,channel,language,fetched_at&order=fetched_at.desc&limit=3');
  console.log('\nRecent videos:');
  for (const v of recentVideos) {
    console.log(`  [${v.language}] ${v.channel}: ${(v.title || '').slice(0, 55)} (${(v.fetched_at || '').slice(0, 16)})`);
  }

  console.log('\n=== PRODUCTION PAGES ===\n');
  const pages = ['/', '/india', '/gcc', '/business', '/sports', '/videos'];
  for (const p of pages) {
    const r = await checkPage(p);
    console.log(`${p.padEnd(12)} HTTP ${r.status}  article-links=${r.hasArticleLinks}  videos=${r.hasVideoEmbed ? 'yes' : 'no'}${r.isEmpty ? '  EMPTY!' : ''}`);
  }

  console.log('\n=== CHECKS ===');
  const regionalLangs = ['ml', 'ta', 'te', 'kn', 'bn'];
  const videoLangs = Object.keys(tally(videos, 'language'));
  const missing = regionalLangs.filter(l => !videoLangs.includes(l));

  console.log(articleCount >= 100 ? `✓ ${articleCount} articles` : `⚠ Only ${articleCount} articles`);
  console.log(videoCount >= 100 ? `✓ ${videoCount} videos` : `⚠ Only ${videoCount} videos`);
  console.log(missing.length === 0 ? '✓ All regional video languages present' : `⚠ Missing video langs: ${missing.join(', ')}`);
  console.log(sourceCount >= 80 ? `✓ ${sourceCount} sources enabled` : `⚠ Only ${sourceCount} sources`);
}

main().catch(err => { console.error(err); process.exit(1); });
