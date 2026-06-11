import { RSS_FEEDS } from '../src/config/feeds.config.js';

/**
 * Seed news sources into Firestore.
 * Usage: node scripts/seed-sources.mjs [path/to/service-account.json]
 */

import { readFileSync } from 'fs';
import { createSign } from 'crypto';

const PROJECT_ID = 'thebharathnews-app';
const saPath = process.argv[2] || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!saPath) {
  console.error('Usage: node scripts/seed-sources.mjs path/to/service-account.json');
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

const REGIONAL_SOURCES = [
  // Malayalam
  { url: 'https://www.onmanorama.com/content/onmanorama/news/news-plus/feeds/news.rss', name: 'Onmanorama', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://www.mathrubhumi.com/news/feeds/rss.xml', name: 'Mathrubhumi', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://news.google.com/rss/search?q=site:asianetnews.com&hl=ml-IN&gl=IN&ceid=IN:ml', name: 'Google News Malayalam', category: 'india', region: 'kerala', language: 'ml', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=ml-IN&gl=IN&ceid=IN:ml', name: 'Google News Kerala', category: 'india', region: 'kerala', language: 'ml', type: 'googlenews' },
  // Tamil
  { url: 'https://news.google.com/rss?hl=ta-IN&gl=IN&ceid=IN:ta', name: 'Google News Tamil', category: 'india', region: 'india', language: 'ta', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:dinamalar.com&hl=ta-IN&gl=IN&ceid=IN:ta', name: 'Dinamalar (Google)', category: 'india', region: 'india', language: 'ta', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:thehindu.com/tamil&hl=ta-IN&gl=IN&ceid=IN:ta', name: 'Hindu Tamil (Google)', category: 'india', region: 'india', language: 'ta', type: 'googlenews' },
  // Telugu
  { url: 'https://news.google.com/rss?hl=te-IN&gl=IN&ceid=IN:te', name: 'Google News Telugu', category: 'india', region: 'india', language: 'te', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:eenadu.net&hl=te-IN&gl=IN&ceid=IN:te', name: 'Eenadu (Google)', category: 'india', region: 'india', language: 'te', type: 'googlenews' },
  // Kannada
  { url: 'https://news.google.com/rss?hl=kn-IN&gl=IN&ceid=IN:kn', name: 'Google News Kannada', category: 'india', region: 'india', language: 'kn', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:prajavani.net&hl=kn-IN&gl=IN&ceid=IN:kn', name: 'Prajavani (Google)', category: 'india', region: 'india', language: 'kn', type: 'googlenews' },
  // Hindi
  { url: 'https://news.google.com/rss?hl=hi-IN&gl=IN&ceid=IN:hi', name: 'Google News Hindi', category: 'india', region: 'india', language: 'hi', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:ndtv.com/hindi&hl=hi-IN&gl=IN&ceid=IN:hi', name: 'NDTV Hindi (Google)', category: 'india', region: 'india', language: 'hi', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:aajtak.in&hl=hi-IN&gl=IN&ceid=IN:hi', name: 'Aaj Tak (Google)', category: 'india', region: 'india', language: 'hi', type: 'googlenews' },
  // GCC global
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

const YOUTUBE_SOURCES = [
  { channelId: 'UCef1-8eOpJgud7BB6sDkibg', name: 'NDTV', category: 'india', region: 'india', language: 'en', type: 'youtube' },
  { channelId: 'UCn_sFHSIJuezVFRIVoGzfAg', name: 'Asianet News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCP0uG-mcMImgKnJz-VjVZkQ', name: 'Manorama News', category: 'india', region: 'kerala', language: 'ml', type: 'youtube' },
  { channelId: 'UCIvaYmXn910QMdemBG3v1pQ', name: 'Al Jazeera English', category: 'gcc', region: 'qatar', language: 'en', type: 'youtube' },
  { channelId: 'UC_gUM8rL-Lrg6O3adPW9K1g', name: 'WION', category: 'india', region: 'india', language: 'en', type: 'youtube' },
];

const RSS_FROM_CONFIG = RSS_FEEDS.map(f => ({
  ...f,
  type: f.url.includes('news.google.com') ? 'googlenews' : 'rss',
  language: f.language || 'en',
  enabled: true,
  trustWeight: 0.85,
}));

const ALL_SOURCES = [...RSS_FROM_CONFIG, ...REGIONAL_SOURCES, ...YOUTUBE_SOURCES];

async function seed() {
  const token = await getToken();
  let created = 0;
  let skipped = 0;

  for (const src of ALL_SOURCES) {
    const id = slugify(src.name);
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
        targetLanguages: 'ml,ta,te,kn,hi,ar',
        headerText: 'The Bharath News',
        footerText: 'India-GCC News for the Global Indian',
      }),
    }),
  });

  console.log(`Seeded ${created} sources (${skipped} already existed), settings/site updated`);
}

seed().catch(err => { console.error(err); process.exit(1); });
