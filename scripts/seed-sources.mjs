import { RSS_FEEDS } from '../src/config/feeds.config.js';
import { REGIONAL_RSS_SOURCES } from '../workers/src/lib/regional-feeds.js';

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
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number') fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map(item => ({ stringValue: String(item) })) } };
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: toFields(v) } };
    }
  }
  return fields;
}

// Regional sources — shared with worker fallback (workers/src/lib/regional-feeds.js)
const REGIONAL_SOURCES = REGIONAL_RSS_SOURCES;

// GCC Google News (English expat coverage)
const GCC_GOOGLE_SOURCES = [
  { url: 'https://news.google.com/rss?hl=en-AE&gl=AE&ceid=AE:en', name: 'Google News UAE', category: 'gcc', region: 'uae', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-SA&gl=SA&ceid=SA:en', name: 'Google News Saudi', category: 'gcc', region: 'saudi', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-QA&gl=QA&ceid=QA:en', name: 'Google News Qatar', category: 'gcc', region: 'qatar', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-KW&gl=KW&ceid=KW:en', name: 'Google News Kuwait', category: 'gcc', region: 'kuwait', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-BH&gl=BH&ceid=BH:en', name: 'Google News Bahrain', category: 'gcc', region: 'bahrain', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=en-OM&gl=OM&ceid=OM:en', name: 'Google News Oman', category: 'gcc', region: 'oman', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Indian+expats+GCC&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News India-GCC', category: 'gcc', region: 'gcc', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=NRIs+UAE+Dubai&hl=en&gl=AE&ceid=AE:en', name: 'Google News NRIs UAE', category: 'gcc', region: 'uae', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Kerala+workers+Gulf&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Kerala Gulf', category: 'gcc', region: 'gcc', language: 'en', type: 'googlenews' },
];

// Channel IDs verified against live YouTube RSS feeds (2026-06-12).
const YOUTUBE_SOURCES = [
  { channelId: 'UCf8w5m0YsRa8MHQ5bwSGmbw', name: 'Asianet News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCP0uG-mcMImgKnJz-VjJZmQ', name: 'Manorama News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UC-f7r46JhYv78q5pGrO6ivA', name: 'MediaOne', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCwXrBBZnIh2ER4lal6WbAHw', name: 'Mathrubhumi News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCnEvxaWfVL91XIYuyQRO5QA', name: 'Kairali News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCFx1nseXKTc1Culiu3neeSQ', name: 'Reporter Live', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UC-mMi78WJST4N5o8_i1FoXw', name: 'News18 Kerala', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCJY38d2Z82irYr00fki974A', name: '24 News Malayalam', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCr-3D8M0HDg8VwQsNM-t3Tw', name: 'Raj News Malayalam', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCfuZhbx-XjSqKya7dAiXTuw', name: 'Janam TV', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCsVJ9ZxMjtSLqmZjjglL__g', name: 'Kerala Vision', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCFcbm8WeZhQIy1sA50zJ3Jg', name: 'Jaihind TV', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCYlh4lH762HvHt6mmiecyWQ', name: 'Sun News', category: 'india', region: 'tamilnadu', language: 'ta', type: 'youtube' },
  { channelId: 'UC8Z-VjXBtDJTvq6aqkIskPg', name: 'Polimer News', category: 'india', region: 'tamilnadu', language: 'ta', type: 'youtube' },
  { channelId: 'UCmyKnNRH0wH-r8I-ceP-dsg', name: 'Puthiyathalaimurai', category: 'india', region: 'tamilnadu', language: 'ta', type: 'youtube' },
  { channelId: 'UC2f4w_ppqHplvjiNaoTAK9w', name: 'News7 Tamil', category: 'india', region: 'tamilnadu', language: 'ta', type: 'youtube' },
  { channelId: 'UCat88i6_rELqI_prwvjspRA', name: 'News18 Tamil Nadu', category: 'india', region: 'tamilnadu', language: 'ta', type: 'youtube' },
  { channelId: 'UCno6OgN7-NDmRTNBgqWevlw', name: 'Captain News', category: 'india', region: 'tamilnadu', language: 'ta', type: 'youtube' },
  { channelId: 'UCOP4Gbw-T1ofcW8vyL89ZDw', name: 'Jaya Plus', category: 'india', region: 'tamilnadu', language: 'ta', type: 'youtube' },
  { channelId: 'UC8dnBi4WUErqYQHZ4PfsLTg', name: 'TV9 Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'youtube' },
  { channelId: 'UCK9eVqJG07tpuQEadDlnwJw', name: 'TV9 Kannada News', category: 'india', region: 'karnataka', language: 'kn', type: 'youtube' },
  { channelId: 'UCa-vioGhe2btBcZneaPonKA', name: 'News18 Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'youtube' },
  { channelId: 'UCtzYV2L-m8ew93mZb3qhf5w', name: 'NTV Telugu', category: 'india', region: 'andhra', language: 'te', type: 'youtube' },
  { channelId: 'UC_2irx_BQR7RsBKmUV9fePQ', name: 'ABN Telugu', category: 'india', region: 'andhra', language: 'te', type: 'youtube' },
  { channelId: 'UCQ_FATLW83q-4xJ2fsi8qAw', name: 'Sakshi TV', category: 'india', region: 'andhra', language: 'te', type: 'youtube' },
  { channelId: 'UClMlGnpuMYDPKwpBufpjfMA', name: 'T News', category: 'india', region: 'telangana', language: 'te', type: 'youtube' },
  { channelId: 'UCRYQj7pRrjm8EwgsUMNVJsQ', name: 'iNews', category: 'india', region: 'andhra', language: 'te', type: 'youtube' },
  { channelId: 'UCixD-KrpjXtMupkzkdFFlFg', name: 'CVR News', category: 'india', region: 'andhra', language: 'te', type: 'youtube' },
  { channelId: 'UC61kgbrqggBKUD2nBb8f3Aw', name: 'Prime9 News', category: 'india', region: 'telangana', language: 'te', type: 'youtube' },
  { channelId: 'UCbf0XHULBkTfv2hBjaaDw9Q', name: 'News18 Bangla', category: 'india', region: 'westbengal', language: 'bn', type: 'youtube' },
  { channelId: 'UCNvCQpcafnbW4KQ8X7oQ9kg', name: 'Kolkata TV', category: 'india', region: 'westbengal', language: 'bn', type: 'youtube' },
  { channelId: 'UCJ3I6MHOz5exARlTW_meOGQ', name: 'Calcutta News', category: 'india', region: 'westbengal', language: 'bn', type: 'youtube' },
];

const DISABLED_YOUTUBE_SOURCE_IDS = [
  'ndtv-yt',
  'al-jazeera-english-yt',
  'wion-yt',
  'zee-news-yt',
  'india-today-yt',
  'india-tv-yt',
];

const RSS_FROM_CONFIG = RSS_FEEDS.map(f => ({
  ...f,
  type: f.url.includes('news.google.com') ? 'googlenews' : 'rss',
  language: f.language || 'en',
  enabled: true,
  trustWeight: 0.85,
}));

const ALL_SOURCES = [...RSS_FROM_CONFIG, ...REGIONAL_SOURCES, ...GCC_GOOGLE_SOURCES, ...YOUTUBE_SOURCES];

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

    const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/sources/${id}`;
    const createUrl = `${base}?currentDocument.exists=false`;
    let res = await fetch(createUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields: toFields(body) }),
    });
    if (res.status === 409) {
      res = await fetch(base, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fields: toFields(body) }),
      });
      if (res.ok) created++;
      else console.error(`Failed update ${src.name}:`, (await res.text()).slice(0, 100));
    } else if (res.ok) created++;
    else console.error(`Failed ${src.name}:`, (await res.text()).slice(0, 100));
  }

  for (const id of DISABLED_YOUTUBE_SOURCE_IDS) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/sources/${id}?updateMask.fieldPaths=enabled`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields: { enabled: { booleanValue: false } } }),
    });
  }

  // Seed default site settings
  const settingsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/settings/site`;
  await fetch(settingsUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fields: toFields({
        qualityThreshold: 6,
        targetLanguages: 'ml,hi,ta,te,kn,bn',
        headerText: 'The Bharath News',
        footerText: 'India-GCC News for the Global Indian',
        siteName: 'The Bharath News',
        tagline: 'Breaking news from India and GCC regions',
        integrations: {
          telegram: { enabled: true, channelId: '@TheBharathNews', channelUrl: 'https://t.me/TheBharathNews', minScoreToPost: 7 },
          whatsapp: { enabled: true, channelUrl: '', showFollowCta: true },
          email: { enabled: true, newsletterFrom: 'The Bharath News <news@thebharathnews.com>', digestEnabled: true },
        },
        pipeline: { rssIngestEnabled: true, videoFetchEnabled: true },
      }),
    }),
  });

  console.log(`Seeded/updated ${created} sources, disabled ${DISABLED_YOUTUBE_SOURCE_IDS.length} legacy YouTube channels, settings/site updated`);
}

seed().catch(err => { console.error(err); process.exit(1); });
