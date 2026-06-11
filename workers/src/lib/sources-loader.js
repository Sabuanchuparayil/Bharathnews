import { getFirebaseToken } from './firebase-auth.js';
import { runQuery, FIRESTORE_BASE } from './firestore-rest.js';
import { FALLBACK_RSS_FEEDS, FALLBACK_YOUTUBE_CHANNELS } from './feeds.js';

let cachedSources = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function loadEnabledSources(env, type = null) {
  if (cachedSources && Date.now() - cacheTime < CACHE_TTL) {
    return type ? cachedSources.filter(s => s.type === type) : cachedSources;
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
      cachedSources = docs;
      cacheTime = Date.now();
      return type ? docs.filter(s => s.type === type) : docs;
    }
  } catch (err) {
    console.error('Failed to load sources from Firestore, using fallback:', err.message);
  }

  const fallback = [
    ...FALLBACK_RSS_FEEDS.map(f => ({ ...f, type: 'rss', enabled: true, trustWeight: 0.8 })),
    ...FALLBACK_YOUTUBE_CHANNELS.map(f => ({ ...f, type: 'youtube', enabled: true, trustWeight: 0.8 })),
  ];
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
    if (!res.ok) return DEFAULT_SETTINGS;
    const data = await res.json();
    const { parseFirestoreFields } = await import('./firestore-rest.js');
    const parsed = parseFirestoreFields(data.fields || {});
    if (typeof parsed.targetLanguages === 'string') {
      parsed.targetLanguages = parsed.targetLanguages.split(',').map(s => s.trim());
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const DEFAULT_SETTINGS = {
  qualityThreshold: 6,
  targetLanguages: ['ml', 'ta', 'te', 'kn', 'hi', 'ar'],
  adSlots: {},
};
