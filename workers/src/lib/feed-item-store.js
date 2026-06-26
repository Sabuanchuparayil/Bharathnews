/**
 * Store RSS items — skip already-published URLs, scan deeper into feeds.
 */
import { upsertRow, patchRawArticle } from './supabase-rest.js';
import { isGenericPublisherImage } from './image-resolver.js';
import { slugifyArticle } from './article-slug.js';
import { inferSubcategoryTag, subcategoryFromFeed } from './subcategory-tagger.js';

import { getLimits } from './cf-limits.js';
import { isBlockedPublisher } from './blocked-sources.js';

const MALAYALAM_CHAR_RE = /[\u0D00-\u0D7F]/;
const DEVANAGARI_CHAR_RE = /[\u0900-\u097F]/;
const TAMIL_CHAR_RE = /[\u0B80-\u0BFF]/;
const TELUGU_CHAR_RE = /[\u0C00-\u0C7F]/;
const KANNADA_CHAR_RE = /[\u0C80-\u0CFF]/;
const BENGALI_CHAR_RE = /[\u0980-\u09FF]/;
const ARABIC_CHAR_RE = /[\u0600-\u06FF]/;

const SCRIPT_MAP = {
  ml: MALAYALAM_CHAR_RE,
  hi: DEVANAGARI_CHAR_RE,
  ta: TAMIL_CHAR_RE,
  te: TELUGU_CHAR_RE,
  kn: KANNADA_CHAR_RE,
  bn: BENGALI_CHAR_RE,
  ur: ARABIC_CHAR_RE,
};

function hasExpectedScript(title, lang) {
  if (lang === 'en' || !lang) return true;
  const re = SCRIPT_MAP[lang];
  if (!re) return true;
  return re.test(title);
}

function normalizeUrl(url) {
  return (url || '').trim().replace(/#.*$/, '');
}

export async function loadKnownSourceUrls(env, urls) {
  const clean = [...new Set(urls.map(normalizeUrl).filter(Boolean))];
  if (!clean.length) return new Set();

  const known = new Set();
  const encoded = clean.map(u => `"${u.replace(/"/g, '')}"`).join(',');

  for (const table of ['articles', 'raw_articles']) {
    try {
      const params = new URLSearchParams();
      params.set('select', 'source_url');
      params.set('source_url', `in.(${encoded})`);
      const res = await fetch(`${(env.SUPABASE_URL || '').replace(/\/$/, '')}/rest/v1/${table}?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      if (!res.ok) continue;
      const rows = await res.json();
      for (const row of rows || []) {
        if (row.source_url) known.add(normalizeUrl(row.source_url));
      }
    } catch {
      /* non-fatal */
    }
  }
  return known;
}

function resolveSubcategory(feed, item) {
  return feed.subcategory
    || inferSubcategoryTag({
      title: item.title,
      description: item.description || '',
      category: feed.category || 'india',
      source: feed.name,
    })
    || subcategoryFromFeed(feed);
}

/**
 * Ingest fresh items from a parsed feed list.
 * Pass `knownUrls` across feeds in the same run to avoid duplicate DB lookups.
 * @returns {{ stored: number, scanned: number, skipped: number }}
 */
export async function ingestFeedItems(env, feed, lang, items, options = {}) {
  const L = getLimits(env);
  const maxStore = options.itemsPerSource ?? L.ITEMS_PER_SOURCE;
  const feedOffset = options.feedOffset ?? 0;
  const knownUrls = options.knownUrls ?? new Set();
  const list = items || [];
  const start = list.length ? feedOffset % list.length : 0;
  const scanDepth = options.feedScanDepth ?? L.FEED_SCAN_DEPTH;
  const rotated = [...list.slice(start), ...list.slice(0, start)].slice(0, scanDepth);

  const newCandidates = rotated
    .map(i => normalizeUrl(i.link))
    .filter(u => u && !knownUrls.has(u));

  if (newCandidates.length) {
    const fetched = await loadKnownSourceUrls(env, newCandidates);
    for (const u of fetched) knownUrls.add(u);
  }

  let stored = 0;
  let skipped = 0;

  for (const item of rotated) {
    if (stored >= maxStore) break;
    if (!item.title || !item.link) {
      skipped++;
      continue;
    }

    const sourceUrl = normalizeUrl(item.link);
    if (knownUrls.has(sourceUrl)) {
      skipped++;
      continue;
    }

    if (isBlockedPublisher({ name: feed.name, sourceUrl: item.link })) {
      skipped++;
      continue;
    }

    if (!hasExpectedScript(item.title, lang)) {
      skipped++;
      continue;
    }

    const slug = slugifyArticle(item.title, { language: lang, sourceUrl: item.link });
    const category = feed.category || 'india';
    const subcategory = resolveSubcategory(feed, item);
    const now = new Date().toISOString();
    const rssImage = item.imageUrl && !isGenericPublisherImage(item.imageUrl) ? item.imageUrl : '';

    const ok = await upsertRow(env, 'raw_articles', {
      slug,
      title: item.title,
      description: item.body || item.description || '',
      source_url: item.link,
      source: feed.name,
      source_id: feed.id || '',
      category,
      subcategory,
      region: feed.region || 'india',
      language: lang,
      image_url: rssImage,
      status: 'pending_ai',
      editorial_status: 'pending',
      published_at: item.pubDate || now,
      created_at: now,
    }, 'slug');

    if (ok) {
      stored++;
      knownUrls.add(sourceUrl);
    } else {
      skipped++;
    }
  }

  return { stored, scanned: rotated.length, skipped };
}
