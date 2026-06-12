import { RSS_FEEDS } from '../src/config/feeds.config.js';

/**
 * Seed news sources into Firestore.
 * Usage: npm run seed:sources [path/to/service-account.json]
 *
 * Credentials (first match wins):
 *   1. CLI argument
 *   2. FIREBASE_SERVICE_ACCOUNT_JSON env var
 *   3. GOOGLE_APPLICATION_CREDENTIALS env var
 *   4. workers/secrets.env → FIREBASE_SERVICE_ACCOUNT_JSON=
 */

import { readFileSync, existsSync } from 'fs';
import { createSign } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECT_ID = 'thebharathnews-app';

function resolveServiceAccountPath() {
  let saPath = process.argv[2] || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';

  if (!saPath && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  if (!saPath) {
    const secretsEnv = join(ROOT, 'workers/secrets.env');
    if (existsSync(secretsEnv)) {
      const line = readFileSync(secretsEnv, 'utf8')
        .split('\n')
        .find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
      if (line) saPath = line.split('=').slice(1).join('=').trim();
    }
  }

  return saPath || null;
}

const saPath = resolveServiceAccountPath();

if (!saPath) {
  console.error(`
Missing Firebase service account JSON.

1. Firebase Console → Project Settings → Service accounts → Generate new private key
2. Save the downloaded file (e.g. ~/Downloads/thebharathnews-app-adminsdk.json)
3. Run ONE of:

   npm run seed:sources ~/Downloads/thebharathnews-app-adminsdk.json

   export FIREBASE_SERVICE_ACCOUNT_JSON=~/Downloads/thebharathnews-app-adminsdk.json
   npm run seed:sources

   # or add FIREBASE_SERVICE_ACCOUNT_JSON=... to workers/secrets.env then:
   npm run seed:sources
`);
  process.exit(1);
}

if (!existsSync(saPath)) {
  console.error(`Service account file not found: ${saPath}`);
  console.error('Use the real path to your downloaded JSON key, not the placeholder "path/to/...".');
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, 'utf8'));

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email, sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key).toString('base64url');
  const jwt = `${header}.${payload}.${sig}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const { access_token } = await res.json();
  return access_token;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
}

function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
  }
  return fields;
}

// Dailyhunt-inspired hybrid content sourcing:
// Tier 1: OneIndia direct RSS feeds (Dailyhunt's core regional content partner,
//         they invested Rs. 15 crore in Greynium/OneIndia specifically for this)
// Tier 2: Google News feeds proxied via rss2json.com (bypasses datacenter IP blocking)
// Tier 3: Direct publisher RSS (Amar Ujala, Sakshi, Al Jazeera Arabic, etc.)
const REGIONAL_SOURCES = [
  // ── Tier 1: OneIndia (Greynium) — core regional partner ──
  { url: 'https://malayalam.oneindia.com/rss/malayalam-news-fb.xml', name: 'OneIndia Malayalam', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml', name: 'OneIndia Tamil', category: 'india', region: 'india', language: 'ta', type: 'rss' },
  { url: 'https://telugu.oneindia.com/rss/telugu-news-fb.xml', name: 'OneIndia Telugu', category: 'india', region: 'india', language: 'te', type: 'rss' },
  { url: 'https://kannada.oneindia.com/rss/kannada-news-fb.xml', name: 'OneIndia Kannada', category: 'india', region: 'india', language: 'kn', type: 'rss' },
  { url: 'https://hindi.oneindia.com/rss/hindi-news-fb.xml', name: 'OneIndia Hindi', category: 'india', region: 'india', language: 'hi', type: 'rss' },

  // ── Tier 2: Google News via rss2json proxy (broad coverage) ──
  { url: 'https://news.google.com/rss?hl=ml-IN&gl=IN&ceid=IN:ml', name: 'Google News Kerala', category: 'india', region: 'kerala', language: 'ml', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=ta-IN&gl=IN&ceid=IN:ta', name: 'Google News Tamil', category: 'india', region: 'india', language: 'ta', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=te-IN&gl=IN&ceid=IN:te', name: 'Google News Telugu', category: 'india', region: 'india', language: 'te', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=kn-IN&gl=IN&ceid=IN:kn', name: 'Google News Kannada', category: 'india', region: 'india', language: 'kn', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=hi-IN&gl=IN&ceid=IN:hi', name: 'Google News Hindi', category: 'india', region: 'india', language: 'hi', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-AE&gl=AE&ceid=AE:en', name: 'Google News UAE', category: 'gcc', region: 'uae', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-SA&gl=SA&ceid=SA:en', name: 'Google News Saudi', category: 'gcc', region: 'saudi', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-QA&gl=QA&ceid=QA:en', name: 'Google News Qatar', category: 'gcc', region: 'qatar', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-KW&gl=KW&ceid=KW:en', name: 'Google News Kuwait', category: 'gcc', region: 'kuwait', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-BH&gl=BH&ceid=BH:en', name: 'Google News Bahrain', category: 'gcc', region: 'bahrain', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-OM&gl=OM&ceid=OM:en', name: 'Google News Oman', category: 'gcc', region: 'oman', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Indian+expats+GCC&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News India-GCC', category: 'gcc', region: 'gcc', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=NRIs+UAE+Dubai&hl=en&gl=AE&ceid=AE:en', name: 'Google News NRIs UAE', category: 'gcc', region: 'uae', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Kerala+workers+Gulf&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Kerala Gulf', category: 'gcc', region: 'gcc', language: 'en', type: 'googlenews' },

  // ── Tier 3: Direct publisher feeds ──
  { url: 'https://www.twentyfournews.com/feed', name: 'Twentyfour News', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://www.sakshi.com/rss.xml', name: 'Sakshi', category: 'india', region: 'india', language: 'te', type: 'rss' },
  { url: 'https://www.amarujala.com/rss/breaking-news.xml', name: 'Amar Ujala', category: 'india', region: 'india', language: 'hi', type: 'rss' },
  { url: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9', name: 'Al Jazeera Arabic', category: 'gcc', region: 'qatar', language: 'ar', type: 'rss' },
];

// Channel IDs verified against live YouTube feeds (2026-06).
const YOUTUBE_SOURCES = [
  { channelId: 'UCZFMm1mMw0F81Z37aaEzTUA', name: 'NDTV', category: 'india', region: 'india', language: 'en', type: 'youtube' },
  { channelId: 'UCf8w5m0YsRa8MHQ5bwSGmbw', name: 'Asianet News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCP0uG-mcMImgKnJz-VjJZmQ', name: 'Manorama News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UC-f7r46JhYv78q5pGrO6ivA', name: 'MediaOne', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', name: 'Al Jazeera English', category: 'gcc', region: 'qatar', language: 'en', type: 'youtube' },
  { channelId: 'UC_gUM8rL-Lrg6O3adPW9K1g', name: 'WION', category: 'india', region: 'india', language: 'en', type: 'youtube' },
  { channelId: 'UCYPvAwZP8pZhSMW8qs7cVCw', name: 'India Today', category: 'india', region: 'india', language: 'en', type: 'youtube' },
];

const RSS_FROM_CONFIG = RSS_FEEDS.map(f => ({
  ...f,
  type: f.url.includes('news.google.com') ? 'googlenews' : 'rss',
  language: f.language || 'en',
  enabled: true,
  trustWeight: 0.85,
}));

const ALL_SOURCES = [...RSS_FROM_CONFIG, ...REGIONAL_SOURCES, ...YOUTUBE_SOURCES];

async function runQuery(token, collectionId) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], limit: 500 } }),
  });
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.filter(d => d.document).map(d => d.document.name);
}

async function wipeSources(token) {
  const names = await runQuery(token, 'sources');
  let deleted = 0;
  for (const name of names) {
    const res = await fetch(`https://firestore.googleapis.com/v1/${name}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) deleted++;
  }
  console.log(`Wiped ${deleted} existing sources`);
}

async function seed() {
  const token = await getToken();
  let created = 0;
  let skipped = 0;

  // Rebuild the sources collection from scratch so corrected URLs/IDs replace stale ones.
  if (process.argv.includes('--wipe') || process.env.WIPE_SOURCES === '1') {
    await wipeSources(token);
  }

  for (const src of ALL_SOURCES) {
    // Suffix non-rss ids so e.g. "NDTV" RSS and "NDTV" YouTube don't collide on the same doc.
    const id = src.type === 'youtube' ? `${slugify(src.name)}-yt`
      : src.type === 'googlenews' ? `${slugify(src.name)}-gn`
      : slugify(src.name);
    const body = {
      ...src,
      enabled: true,
      trustWeight: src.trustWeight ?? 0.8,
      lastError: '',
      itemCount: 0,
    };
    if (src.type === 'youtube') {
      body.url = `https://www.youtube.com/feeds/videos.xml?channel_id=${src.channelId}`;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/sources/${id}?currentDocument.exists=false`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields: toFields(body) }),
    });
    if (res.status === 409) skipped++;
    else if (res.ok) created++;
    else console.error(`Failed ${src.name}:`, (await res.text()).slice(0, 100));
  }

  // Seed default site settings
  const settingsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/site`;
  await fetch(settingsUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fields: toFields({
        qualityThreshold: 6,
        targetLanguages: 'ml,hi,ar',
        headerText: 'The Bharath News',
        footerText: 'India-GCC News for the Global Indian',
      }),
    }),
  });

  console.log(`Seeded ${created} sources (${skipped} already existed), settings/site updated`);
}

seed().catch(err => { console.error(err); process.exit(1); });
