import { getFirebaseToken } from './firebase-auth.js';
import { runQuery, FIRESTORE_BASE } from './firestore-rest.js';
import { FALLBACK_RSS_FEEDS, FALLBACK_YOUTUBE_CHANNELS } from './feeds.js';
import { REGIONAL_RSS_SOURCES } from './regional-feeds.js';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings, parseTargetLanguages } from './site-settings.js';

let cachedSources = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function slugifySource(name, type) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  return type === 'youtube' ? `${base}-yt` : type === 'googlenews' ? `${base}-gn` : base;
}

/** MergeMerge regional feeds into Firestore sources so stale seeds still get regional coverage. */
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
    const filtered = type ? cachedSources.filter(s => s.type === type) : cachedSources;
    return filtered;
  }

  try {
    const token = await getFirebaseToken(env);
    const query = {
      from: [{ collectionId: 'sources' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'enabled' },
          op: 'EQUAL',
          value: { booleanValue: true },
        },
      },
      limit: 200,
    };
    const docs = await runQuery(env, query, token);
    if (docs.length > 0) {
      cachedSources = ensureRegionalSources(docs);
      cacheTime = Date.now();
      return type ? cachedSources.filter(s => s.type === type) : cachedSources;
    }
  } catch (err) {
    console.error('Failed to load sources from Firestore, using fallback:', err.message);
  }

  const fallback = ensureRegionalSources([
    ...FALLBACK_RSS_FEEDS.map(f => ({ ...f, type: f.url?.includes('news.google.com') ? 'googlenews' : 'rss', enabled: true, trustWeight: 0.8 })),
    ...FALLBACK_YOUTUBE_CHANNELS.map(f => ({ ...f, type: 'youtube', enabled: true, trustWeight: 0.8 })),
  ]);
  cachedSources = fallback;
  cacheTime = Date.now();
  return type ? fallback.filter(s => s.type === type) : fallback;
}

export async function updateSourceHealth(env, sourceId, { itemCount = 0, lastError = '' } = {}, token) {
  if (!sourceId || !token) return;
  const url = `${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/sources/${sourceId}?updateMask.fieldPaths=lastFetchedAt&updateMask.fieldPaths=itemCount&updateMask.fieldPaths=lastError`;
  await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fields: {
        lastFetchedAt: { timestampValue: new Date().toISOString() },
        itemCount: { integerValue: String(itemCount) },
        lastError: { stringValue: lastError || '' },
      },
    }),
  });
}

export async function loadSiteSettings(env) {
  try {
    const token = await getFirebaseToken(env);
    const res = await fetch(
      `${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/settings/site`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return mergeSiteSettings();
    const data = await res.json();
    const { parseFirestoreFields } = await import('./firestore-rest.js');
    const parsed = parseFirestoreFields(data.fields || {});
    return mergeSiteSettings(parsed);
  } catch {
    return mergeSiteSettings();
  }
}

export { DEFAULT_SITE_SETTINGS, mergeSiteSettings, parseTargetLanguages };
