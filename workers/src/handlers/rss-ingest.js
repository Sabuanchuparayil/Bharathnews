import { loadEnabledSources, updateSourceHealth } from '../lib/sources-loader.js';
import { getCategoryFallbackImage } from '../lib/image-resolver.js';
import { fetchAndParseFeed } from '../lib/rss-parser.js';
import { getFirebaseToken } from '../lib/firebase-auth.js';
import { FIRESTORE_BASE } from '../lib/firestore-rest.js';

/** Sources fetched per cron run. Kept low because Workers free tier allows only 50
 * subrequests per invocation (1 fetch + up to ITEMS_PER_SOURCE stores + 1 health each).
 * Rotation (least-recently-fetched first) still covers every source within a few runs. */
const MAX_SOURCES_PER_RUN = 6;
const ITEMS_PER_SOURCE = 5;
const PARALLEL_BATCH = 3;

/** Parse a feed date safely; falls back to now for malformed pubDate values. */
function safeISODate(value) {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** Unicode-safe slug for regional language headlines (Malayalam, Tamil, Hindi, Arabic, etc.) */
function slugifyTitle(title) {
  const slug = (title || '')
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || `article-${Date.now().toString(36)}`;
}

/**
 * Rotate through ALL sources by least-recently-fetched first.
 * Never-fetched sources (no lastFetchedAt) sort to the front, so newly added /
 * regional-language feeds get ingested immediately. Within the same freshness,
 * one source per language is interleaved so each run stays language-diverse.
 */
function rotateSourcePick(sources, maxTotal) {
  const ts = (s) => (s.lastFetchedAt ? new Date(s.lastFetchedAt).getTime() : 0);
  const sorted = [...sources].sort((a, b) => ts(a) - ts(b));

  // Interleave by language to avoid a single run being all-English or all one language.
  const byLang = {};
  for (const s of sorted) {
    const lang = s.language || 'en';
    (byLang[lang] = byLang[lang] || []).push(s);
  }
  const langs = Object.keys(byLang);
  const picked = [];
  let added = true;
  while (picked.length < maxTotal && added) {
    added = false;
    for (const lang of langs) {
      const next = byLang[lang].shift();
      if (next) {
        picked.push(next);
        added = true;
        if (picked.length >= maxTotal) break;
      }
    }
  }
  return picked;
}

async function ingestOneFeed(env, feed, token) {
  const results = [];
  try {
    const items = await fetchAndParseFeed(feed.url);
    let stored = 0;

    for (const item of items.slice(0, ITEMS_PER_SOURCE)) {
      if (!item.title || !item.link) continue;

      const slug = slugifyTitle(item.title);
      const category = feed.category || 'india';
      // RSS media when present; category placeholder otherwise. og:image is resolved at
      // publish time in ai-process when imageUrl is empty or a category fallback.
      const imageUrl = item.imageUrl || getCategoryFallbackImage(category);
      const ok = await storeRawArticle(env, {
        title: item.title,
        description: item.description || '',
        sourceUrl: item.link,
        source: feed.name,
        sourceId: feed.id,
        category: feed.category || 'india',
        region: feed.region || 'india',
        language: feed.language || 'en',
        publishedAt: item.pubDate || new Date().toISOString(),
        imageUrl,
        slug,
      }, token);

      if (ok) {
        stored++;
        results.push(item.title);
      }
    }

    await updateSourceHealth(env, feed.id, { itemCount: stored, lastError: '' }, token);
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error.message);
    await updateSourceHealth(env, feed.id, { itemCount: 0, lastError: error.message.slice(0, 200) }, token);
  }
  return results;
}

export async function handleRSSIngest(env) {
  const token = await getFirebaseToken(env);
  const allSources = await loadEnabledSources(env, 'rss');
  const googleSources = await loadEnabledSources(env, 'googlenews');
  const sources = rotateSourcePick([...allSources, ...googleSources], MAX_SOURCES_PER_RUN);
  const results = [];

  for (let i = 0; i < sources.length; i += PARALLEL_BATCH) {
    const batch = sources.slice(i, i + PARALLEL_BATCH);
    const batchResults = await Promise.all(
      batch.map(feed => ingestOneFeed(env, feed, token))
    );
    for (const r of batchResults) results.push(...r);
  }

  console.log(`RSS ingest complete: ${results.length} new articles from ${sources.length} sources`);
  return results;
}

async function storeRawArticle(env, article, token) {
  const docUrl = `${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/raw_articles/${article.slug}?currentDocument.exists=false`;

  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: article.title },
        description: { stringValue: article.description },
        sourceUrl: { stringValue: article.sourceUrl },
        source: { stringValue: article.source },
        sourceId: { stringValue: article.sourceId || '' },
        category: { stringValue: article.category },
        region: { stringValue: article.region },
        language: { stringValue: article.language },
        slug: { stringValue: article.slug },
        imageUrl: { stringValue: article.imageUrl },
        status: { stringValue: 'pending_ai' },
        publishedAt: { timestampValue: safeISODate(article.publishedAt) },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });

  if (res.status === 409) return false;
  if (!res.ok) {
    const err = await res.text();
    console.error(`Store failed for "${article.title.slice(0, 40)}":`, err.slice(0, 150));
    return false;
  }
  return true;
}
