/**
 * Fetch YouTube videos directly into Supabase (bypasses Worker subrequest limits).
 * Usage: npm run fetch:videos
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { YOUTUBE_CHANNELS } from '../src/config/feeds.config.js';

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
const MAX_CHANNELS = parseInt(process.env.VIDEO_FETCH_CHANNELS || '32', 10);
const ITEMS_PER_CHANNEL = parseInt(process.env.VIDEO_FETCH_ITEMS || '8', 10);

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

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripHtml(text) {
  return decodeEntities(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function parseAtomFeed(xml) {
  const items = [];
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const link = extractAttr(block, 'link', 'href') || extractTag(block, 'link');
    items.push({
      title: stripHtml(extractTag(block, 'title')),
      link: decodeEntities(link).trim(),
      pubDate: extractTag(block, 'published') || extractTag(block, 'updated'),
    });
  }
  return items;
}

function extractVideoId(link) {
  if (!link) return null;
  for (const re of [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /yt:video:([a-zA-Z0-9_-]{11})/,
  ]) {
    const m = link.match(re);
    if (m) return m[1];
  }
  return null;
}

function parsePubDate(pubDate) {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchChannelFeed(channel) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'TheBharathNews/1.0 (RSS Reader)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  return parseAtomFeed(xml);
}

async function upsertVideo(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/videos?on_conflict=video_id`, {
    method: 'POST',
    headers,
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err.slice(0, 300));
  }
}


async function main() {
  const channels = YOUTUBE_CHANNELS.slice(0, MAX_CHANNELS);
  console.log(`Fetching videos from ${channels.length} YouTube channels...`);

  let stored = 0;
  let errors = 0;

  for (const channel of channels) {
    try {
      const items = await fetchChannelFeed(channel);
      let channelStored = 0;

      for (const item of items.slice(0, ITEMS_PER_CHANNEL)) {
        const videoId = extractVideoId(item.link);
        if (!videoId || !item.title) continue;

        const sortDate = parsePubDate(item.pubDate) || new Date().toISOString();
        const row = {
          video_id: videoId,
          title: item.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          channel: channel.name,
          channel_id: channel.channelId,
          category: channel.category || 'india',
          language: channel.language || 'en',
          published_at: sortDate,
          fetched_at: sortDate,
        };

        try {
          await upsertVideo(row);
          channelStored++;
          stored++;
        } catch (err) {
          if (err.message.includes('channel_id') || err.message.includes('published_at')) {
            const { channel_id, published_at, ...core } = row;
            await upsertVideo(core);
            channelStored++;
            stored++;
          } else {
            throw err;
          }
        }
      }

      console.log(`  ✓ ${channel.name}: ${channelStored} videos`);
    } catch (err) {
      errors++;
      console.error(`  ✗ ${channel.name}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${stored} videos stored, ${errors} channel errors.`);
  if (stored === 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
