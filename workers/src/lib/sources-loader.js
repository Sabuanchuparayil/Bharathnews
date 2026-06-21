import { FALLBACK_RSS_FEEDS, FALLBACK_YOUTUBE_CHANNELS } from './feeds.js';
import { REGIONAL_RSS_SOURCES } from './regional-feeds.js';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings, parseTargetLanguages } from './site-settings.js';
import { selectRows, patchRow, getSiteSettingsRow } from './supabase-rest.js';
import { filterBlockedSources } from './blocked-sources.js';

let cachedSources = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function slugifySource(name, type) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  return type === 'youtube' ? `${base}-yt` : type === 'googlenews' ? `${base}-gn` : base;
}

function ensureRegionalSources(sources) {
  const urls = new Set(sources.map(s => s.url).filter(Boolean));
  const merged = [...sources];
  for (const src of REGIONAL_RSS_SOURCES) {
    if (urls.has(src.url)) continue;
    merged.push({
      ...src,
      id: slugifySource(src.name, src.type),
      enabled: true,
      trustWeight: 0.85,
    });
    urls.add(src.url);
  }
  return merged;
}

export async function loadEnabledSources(env, type = null) {
  if (cachedSources && Date.now() - cacheTime < CACHE_TTL) {
    return type ? cachedSources.filter(s => s.type === type) : cachedSources;
  }

  try {
    const docs = await selectRows(env, 'sources', {
      filters: { enabled: true },
      limit: 200,
    });
    if (docs.length > 0) {
      cachedSources = filterBlockedSources(ensureRegionalSources(docs));
      cacheTime = Date.now();
      const filtered = type ? cachedSources.filter(s => s.type === type) : cachedSources;
      if (type === 'youtube' && !filtered.length) {
        return FALLBACK_YOUTUBE_CHANNELS.map(f => ({
          ...f,
          id: `${f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-yt`,
          type: 'youtube',
          enabled: true,
          trustWeight: 0.8,
          url: `https://www.youtube.com/feeds/videos.xml?channel_id=${f.channelId}`,
        }));
      }
      return filtered;
    }
  } catch (err) {
    console.error('Failed to load sources from Supabase, using fallback:', err.message);
  }

  const fallback = ensureRegionalSources([
    ...FALLBACK_RSS_FEEDS.map(f => ({ ...f, type: f.url?.includes('news.google.com') ? 'googlenews' : 'rss', enabled: true, trustWeight: 0.8 })),
    ...FALLBACK_YOUTUBE_CHANNELS.map(f => ({ ...f, type: 'youtube', enabled: true, trustWeight: 0.8 })),
  ]);
  cachedSources = fallback;
  cacheTime = Date.now();
  return type ? fallback.filter(s => s.type === type) : fallback;
}

export async function updateSourceHealth(env, sourceId, { itemCount = 0, lastError = '' } = {}) {
  if (!sourceId) return;
  await patchRow(env, 'sources', 'id', sourceId, {
    last_fetched_at: new Date().toISOString(),
    item_count: itemCount,
    last_error: lastError || '',
  });
}

export async function loadSiteSettings(env) {
  try {
    const parsed = await getSiteSettingsRow(env);
    return mergeSiteSettings(parsed || {});
  } catch {
    return mergeSiteSettings();
  }
}

export { DEFAULT_SITE_SETTINGS, mergeSiteSettings, parseTargetLanguages };
