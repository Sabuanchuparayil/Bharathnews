/**
 * Supabase PostgREST helpers for Cloudflare Workers.
 * Replaces Firestore REST API — uses service_role key from env.
 */

export function supabaseHeaders(env) {
  const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: 'return=representation',
  };
}

export function supabaseBase(env) {
  const url = (env.SUPABASE_URL || '').replace(/\/$/, '');
  return `${url}/rest/v1`;
}

/** Convert snake_case DB row to camelCase for worker handlers */
export function rowToApp(row) {
  if (!row) return row;
  const map = {
    full_content: 'fullContent',
    image_url: 'imageUrl',
    source_url: 'sourceUrl',
    editorial_status: 'editorialStatus',
    quality_score: 'qualityScore',
    published_at: 'publishedAt',
    created_at: 'createdAt',
    source_id: 'sourceId',
    detected_language: 'detectedLanguage',
    cluster_id: 'clusterId',
    reject_reason: 'rejectReason',
    last_fetched_at: 'lastFetchedAt',
    last_error: 'lastError',
    item_count: 'itemCount',
    trust_weight: 'trustWeight',
    video_id: 'videoId',
    channel_id: 'channelId',
    fetched_at: 'fetchedAt',
  };
  const out = { id: row.id ?? row.slug, slug: row.slug };
  for (const [k, v] of Object.entries(row)) {
    out[map[k] || k] = v;
  }
  return out;
}

export async function selectRows(env, table, { filters = {}, order, ascending = true, limit = 50, select = '*' } = {}) {
  const params = new URLSearchParams();
  params.set('select', select);
  for (const [key, val] of Object.entries(filters)) {
    params.set(key, `eq.${val}`);
  }
  if (order) {
    params.set('order', `${order}.${ascending ? 'asc' : 'desc'}`);
  }
  if (limit) params.set('limit', String(limit));

  const res = await fetch(`${supabaseBase(env)}/${table}?${params}`, {
    headers: supabaseHeaders(env),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase select ${table} failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data || []).map(rowToApp);
}

/** Legacy-compatible runQuery for pipeline handlers */
export async function runQuery(env, structuredQuery, _token) {
  const from = structuredQuery.from?.[0]?.collectionId;
  if (!from) return [];

  const table = from.replace(/-/g, '_');
  const filters = {};
  let order = 'created_at';
  let ascending = true;
  let limit = structuredQuery.limit || 50;

  const where = structuredQuery.where?.fieldFilter;
  if (where) {
    const field = where.field?.fieldPath?.replace(/([A-Z])/g, '_$1').toLowerCase();
    const val = where.value?.stringValue ?? where.value?.booleanValue ?? where.value?.integerValue;
    if (field && val !== undefined) filters[field] = val;
  }

  if (structuredQuery.orderBy?.[0]) {
    order = structuredQuery.orderBy[0].field?.fieldPath?.replace(/([A-Z])/g, '_$1').toLowerCase() || order;
    ascending = structuredQuery.orderBy[0].direction !== 'DESCENDING';
  }

  return selectRows(env, table, { filters, order, ascending, limit });
}

export async function upsertRow(env, table, row, onConflict = 'slug') {
  const conflictParam = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
  const res = await fetch(`${supabaseBase(env)}/${table}${conflictParam}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(env),
      Prefer: `resolution=merge-duplicates,return=minimal`,
    },
    body: JSON.stringify(row),
  });
  if (res.status === 409) return false;
  if (!res.ok) {
    const err = await res.text();
    console.error(`Upsert ${table} failed:`, err.slice(0, 200));
    return false;
  }
  return true;
}

export async function insertRow(env, table, row) {
  const res = await fetch(`${supabaseBase(env)}/${table}`, {
    method: 'POST',
    headers: { ...supabaseHeaders(env), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert ${table} failed: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function patchRow(env, table, matchCol, matchVal, updates) {
  const params = new URLSearchParams();
  params.set(matchCol, `eq.${matchVal}`);

  const res = await fetch(`${supabaseBase(env)}/${table}?${params}`, {
    method: 'PATCH',
    headers: { ...supabaseHeaders(env), Prefer: 'return=minimal' },
    body: JSON.stringify(updates),
  });
  return res.ok;
}

export async function patchRawArticle(env, slug, updates) {
  return patchRow(env, 'raw_articles', 'slug', slug, updates);
}

export async function countRows(env, table, filters = {}) {
  const params = new URLSearchParams();
  params.set('select', 'id');
  for (const [key, val] of Object.entries(filters)) {
    params.set(key, `eq.${val}`);
  }
  const res = await fetch(`${supabaseBase(env)}/${table}?${params}`, {
    method: 'HEAD',
    headers: {
      ...supabaseHeaders(env),
      Prefer: 'count=exact',
    },
  });
  const range = res.headers.get('content-range');
  if (!range) return 0;
  const total = range.split('/')[1];
  return parseInt(total, 10) || 0;
}

export async function getSiteSettingsRow(env) {
  try {
    const rows = await selectRows(env, 'site_settings', { filters: { key: 'site' }, limit: 1 });
    if (rows.length) return rows[0].value || rows[0];
    const res = await fetch(`${supabaseBase(env)}/site_settings?key=eq.site&select=value`, {
      headers: supabaseHeaders(env),
    });
    const data = await res.json();
    return data?.[0]?.value || null;
  } catch {
    return null;
  }
}

/** @deprecated — token unused; kept for drop-in migration */
export async function getFirebaseToken(_env) {
  return 'supabase-service-role';
}

export const FIRESTORE_BASE = () => '';
