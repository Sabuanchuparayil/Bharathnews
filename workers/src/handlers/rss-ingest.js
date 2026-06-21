import { loadEnabledSources, updateSourceHealth, loadSiteSettings } from '../lib/sources-loader.js';
import { fetchAndParseFeed } from '../lib/rss-parser.js';
import { rotateSourcePick } from '../lib/regional-rotation.js';
import { ingestFeedItems } from '../lib/feed-item-store.js';
import { getLimits } from '../lib/cf-limits.js';

function pickSources(sources, maxTotal, priorityCategories = new Set(), priorityLanguages = new Set()) {
  return rotateSourcePick(sources, maxTotal, priorityCategories, priorityLanguages);
}

async function ingestOneFeed(env, feed, itemsPerSource) {
  const results = [];
  try {
    const items = await fetchAndParseFeed(feed.url);
    const feedOffset = Math.floor(Date.now() / (10 * 60 * 1000)) % 5;
    const { stored } = await ingestFeedItems(env, feed, feed.language || 'en', items, {
      itemsPerSource,
      feedOffset,
    });

    for (let i = 0; i < stored; i++) results.push('stored');
    await updateSourceHealth(env, feed.id, { itemCount: stored, lastError: '' });
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error.message);
    await updateSourceHealth(env, feed.id, { itemCount: 0, lastError: error.message.slice(0, 200) });
  }
  return results;
}

/** Lightweight mixed ingest — source count tuned by tier in cf-limits.js. */
export async function handleRSSIngest(env) {
  const L = getLimits(env);
  const settings = await loadSiteSettings(env);
  if (settings.pipeline?.rssIngestEnabled === false) {
    console.log('RSS ingest skipped: disabled in site settings');
    return [];
  }

  const [allSources, googleSources] = await Promise.all([
    loadEnabledSources(env, 'rss'),
    loadEnabledSources(env, 'googlenews'),
  ]);

  const englishDirect = allSources.filter(s => (s.language || 'en') === 'en');
  const nonEnglish = [...allSources, ...googleSources].filter(s => (s.language || 'en') !== 'en');

  const englishSlots = Math.min(L.ENGLISH_SOURCES_PER_TICK, englishDirect.length);
  const nonEnglishSlots = Math.max(0, L.MIXED_RSS_SOURCES - englishSlots);

  const pickedEnglish = englishDirect.length
    ? pickSources(englishDirect, englishSlots, new Set(), new Set())
    : [];
  const pickedNonEnglish = nonEnglishSlots > 0
    ? pickSources(nonEnglish, nonEnglishSlots, new Set(), new Set())
    : [];

  const sources = [...pickedEnglish, ...pickedNonEnglish];
  const results = [];

  // Sequential only — respects CF 6-connection limit and subrequest budget
  for (const feed of sources) {
    const r = await ingestOneFeed(env, feed, L.ITEMS_PER_SOURCE);
    results.push(...r);
  }

  console.log(`RSS ingest complete: ${results.length} new articles from ${sources.length} sources (${pickedEnglish.length} en + ${pickedNonEnglish.length} regional)`);
  return results;
}
