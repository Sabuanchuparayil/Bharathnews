import { REGIONAL_RSS_SOURCES, REGIONAL_LANGUAGES, MALAYALAM_RSS_SOURCES, DISABLED_ML_FEED_URLS } from '../lib/regional-feeds.js';
import { FALLBACK_RSS_FEEDS, GOOGLE_NEWS_TOPIC_FEEDS } from '../lib/feeds.js';
import { fetchAndParseFeed } from '../lib/rss-parser.js';
import { loadEnabledSources, updateSourceHealth } from '../lib/sources-loader.js';
import { rotateSourcePick } from '../lib/regional-rotation.js';
import { handleFastPublish } from './fast-publish.js';
import { ingestFeedItems } from '../lib/feed-item-store.js';
import { getLimits, getCronPublishOpts, pickLangSlice } from '../lib/cf-limits.js';

function dedupeByUrl(sources) {
  const seen = new Set();
  const out = [];
  for (const s of sources) {
    if (!s?.url || seen.has(s.url)) continue;
    seen.add(s.url);
    out.push(s);
  }
  return out;
}

async function resolveEnglishSources(env, maxSources) {
  const [rss, googlenews] = await Promise.all([
    loadEnabledSources(env, 'rss'),
    loadEnabledSources(env, 'googlenews'),
  ]);

  const directRss = dedupeByUrl(rss.filter(s => (s.language || 'en') === 'en'));
  const gnSources = dedupeByUrl([
    ...GOOGLE_NEWS_TOPIC_FEEDS,
    ...googlenews.filter(s => (s.language || 'en') === 'en'),
  ]);

  // Reserve at least 60% of slots for direct RSS (reliable) and up to 40% for Google News
  const directSlots = Math.max(Math.ceil(maxSources * 0.6), Math.min(directRss.length, maxSources));
  const gnSlots = Math.max(0, maxSources - directSlots);

  const pickedDirect = directRss.length
    ? rotateSourcePick(directRss, directSlots)
    : [];
  const pickedGN = gnSlots > 0 && gnSources.length
    ? rotateSourcePick(gnSources, gnSlots)
    : [];

  const combined = [...pickedDirect, ...pickedGN];

  if (combined.length) return combined;

  return FALLBACK_RSS_FEEDS
    .filter(f => (f.language || 'en') === 'en')
    .slice(0, maxSources)
    .map(f => ({
      ...f,
      type: f.url?.includes('news.google.com') ? 'googlenews' : 'rss',
      enabled: true,
    }));
}

async function resolveRegionalSources(env, lang, maxSources) {
  const [rss, googlenews] = await Promise.all([
    loadEnabledSources(env, 'rss'),
    loadEnabledSources(env, 'googlenews'),
  ]);

  const direct = dedupeByUrl(rss.filter(s => s.language === lang));
  const gn = dedupeByUrl(googlenews.filter(s => s.language === lang));

  const directSlots = Math.min(direct.length, Math.max(1, Math.ceil(maxSources * 0.67)));
  const gnSlots = Math.max(0, maxSources - directSlots);

  const pickedDirect = direct.length
    ? rotateSourcePick(direct, directSlots, new Set(), new Set([lang]))
    : [];
  const pickedGn = gnSlots > 0 && gn.length
    ? rotateSourcePick(gn, gnSlots, new Set(), new Set([lang]))
    : [];

  let combined = [...pickedDirect, ...pickedGn];

  if (lang === 'ml') {
    const mlFallback = MALAYALAM_RSS_SOURCES.map(f => ({
      ...f,
      id: f.id || f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      enabled: true,
      trustWeight: 0.9,
    }));
    combined = dedupeByUrl([...combined, ...mlFallback])
      .filter(s => s.language === 'ml' && !DISABLED_ML_FEED_URLS.has(s.url));
  }

  if (combined.length) {
    return rotateSourcePick(combined, maxSources, new Set(), new Set([lang]));
  }

  return REGIONAL_RSS_SOURCES
    .filter(s => s.language === lang && !DISABLED_ML_FEED_URLS.has(s.url))
    .slice(0, maxSources);
}

async function ingestOneSource(env, feed, lang, itemsPerSource, feedOffset = 0, knownUrls, extraOptions = {}) {
  try {
    const items = await fetchAndParseFeed(feed.url);
    const { stored } = await ingestFeedItems(env, feed, lang, items, {
      itemsPerSource,
      feedOffset,
      knownUrls,
      feedScanDepth: extraOptions.feedScanDepth,
    });
    await updateSourceHealth(env, feed.id, { itemCount: stored, lastError: '' });
    return stored;
  } catch (e) {
    await updateSourceHealth(env, feed.id, { itemCount: 0, lastError: e.message.slice(0, 200) });
    throw e;
  }
}

/**
 * Ingest RSS for a single language, then fast-publish pending rows.
 * Used by /api/ingest-lang and the English dedicated cron.
 */
export async function handleIngestLang(env, options = {}) {
  const L = getLimits(env);
  const lang = options.lang || 'ml';
  const maxSources = options.maxSources ?? (lang === 'en'
    ? L.ENGLISH_SOURCES_PER_TICK
    : L.REGIONAL_SOURCES_DEFAULT);
  const itemsPerSource = lang === 'ml'
    ? (options.itemsPerSource ?? 5)
    : (options.itemsPerSource ?? L.ITEMS_PER_SOURCE);
  const publish = options.publish !== false;
  const feedOffset = options.feedOffset ?? Math.floor(Date.now() / (10 * 60 * 1000)) % 5;
  const mlOpts = lang === 'ml'
    ? { feedScanDepth: 15, itemsPerSource: options.itemsPerSource ?? 5 }
    : {};

  const sources = lang === 'en'
    ? await resolveEnglishSources(env, maxSources)
    : await resolveRegionalSources(env, lang, maxSources);

  const results = {
    lang,
    sources: sources.length,
    sourceNames: sources.map(s => s.name),
    ingested: 0,
    errors: [],
  };

  const knownUrls = new Set();

  for (const feed of sources) {
    try {
      results.ingested += await ingestOneSource(
        env, feed, lang, itemsPerSource, feedOffset, knownUrls, mlOpts,
      );
    } catch (e) {
      results.errors.push({ source: feed.name, error: e.message });
    }
  }

  if (publish) {
    const pubResult = await handleFastPublish(env, getCronPublishOpts(env));
    results.published = pubResult.published || 0;
  } else {
    results.published = 0;
  }

  console.log(`[ingest-lang:${lang}] ingested=${results.ingested} published=${results.published}`, results.sourceNames.join(', '));
  return results;
}

/** Rotate 2 regional languages per 10-min tick (all 7 covered every ~35 min). */
export function pickRegionalLangGroup(tick = null, env = null) {
  const L = getLimits(env);
  const t = tick ?? Math.floor(Date.now() / (10 * 60 * 1000));
  return pickLangSlice(REGIONAL_LANGUAGES, t, L.REGIONAL_LANGS_PER_TICK);
}

/** Dedicated English pass — direct RSS sources per tick (tier-dependent). */
export async function handleEnglishIngestCron(env) {
  const L = getLimits(env);
  return handleIngestLang(env, {
    lang: 'en',
    maxSources: L.ENGLISH_SOURCES_PER_TICK,
    itemsPerSource: L.ITEMS_PER_SOURCE,
    publish: false,
  });
}

/**
 * Ingest regional languages — capped by tier limits in cf-limits.js.
 */
export async function handleRegionalIngestCron(env, options = {}) {
  const L = getLimits(env);
  let languages = options.languages;
  let maxSources = options.maxSources
    ?? (languages?.length >= 3 ? L.REGIONAL_SOURCES_WHEN_MANY_LANGS : L.REGIONAL_SOURCES_DEFAULT);
  let itemsPerSource = options.itemsPerSource ?? L.ITEMS_PER_SOURCE;
  const feedOffset = options.feedOffset ?? Math.floor(Date.now() / (10 * 60 * 1000)) % 5;
  const skipPublish = options.skipPublish === true;

  if (!languages) {
    if (options.allLanguages) {
      languages = REGIONAL_LANGUAGES;
      maxSources = 1;
      itemsPerSource = L.ITEMS_PER_SOURCE;
    } else {
      languages = pickRegionalLangGroup(options.tick, env);
    }
  }

  const results = [];
  let totalIngested = 0;

  for (const lang of languages) {
    try {
      const r = await handleIngestLang(env, {
        lang,
        maxSources,
        itemsPerSource,
        feedOffset,
        publish: false,
      });
      totalIngested += r.ingested;
      results.push(r);
    } catch (e) {
      results.push({ lang, ingested: 0, errors: [{ error: e.message }] });
    }
  }

  let published = 0;
  let malayalamPublished = 0;
  if (!skipPublish) {
    const pub = await handleFastPublish(env, getCronPublishOpts(env));
    published = pub.published || 0;
    if (languages.includes('ml')) {
      const { handlePublishMalayalam } = await import('./fast-publish.js');
      const mlPub = await handlePublishMalayalam(env, { batchSize: 6, maxRounds: 2 });
      malayalamPublished = mlPub.published || 0;
      published += malayalamPublished;
    }
  }

  const summary = {
    languages: languages.length,
    languageCodes: languages,
    totalIngested,
    published,
    malayalamPublished,
    maxSources,
    itemsPerSource,
    byLang: results.map(r => ({ lang: r.lang, ingested: r.ingested, sources: r.sourceNames })),
  };
  console.log('[cron] regional-ingest done:', summary);
  return summary;
}
