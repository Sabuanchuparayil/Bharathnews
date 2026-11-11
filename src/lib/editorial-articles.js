import { getSupabaseAdmin } from './supabase-server';
import { slugify } from '@/utils/slugify';
import { rowToApp, rowsToApp } from '@/lib/db-mapper';
import { onArticlePublished } from '@/lib/on-article-published';
import { resolveStaffAuthor } from '@/lib/staff-profiles';

const OPTIONAL_COLUMNS = [
  'is_ai_assisted', 'editor_notes', 'revision_count', 'scheduled_at', 'submitted_by',
  'image_credit', 'author_photo_url', 'author_title',
  'assigned_to', 'assigned_at',
];

const CATEGORIES = new Set([
  'india', 'gcc', 'business', 'technology', 'sports', 'entertainment', 'health',
  'education', 'jobs', 'realestate', 'lifestyle', 'opinion', 'world', 'breaking',
]);

const LANGUAGE_NAMES = { en: 'English', ml: 'Malayalam' };

function cleanText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/** Checked on every publish: the board member signs it off and confirms the category. */
export function validatePublishInput(body) {
  const publisherSlug = slugify(body?.publisherSlug || '');
  const category = cleanText(body?.category, 40);
  if (!publisherSlug) return { error: 'Choose the editorial board member publishing this story.' };
  if (!CATEGORIES.has(category)) return { error: 'Confirm a valid category before publishing.' };
  return { value: { publisherSlug, category } };
}

async function resolveBoardMember(supabase, slug) {
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Could not load the editorial board.');
  if (!data) throw badRequest('That editorial board member is not active. Pick someone else.');
  const profile = rowToApp(data);
  return {
    author: profile.displayName,
    author_slug: profile.slug,
    author_photo_url: profile.photoURL || '',
    author_title: profile.title || '',
  };
}

/** Both English and Malayalam must be complete; returns the missing language names. */
function missingLanguages({ language, title, fullContent, translations }) {
  const primary = language === 'ml' ? 'ml' : 'en';
  const other = primary === 'en' ? 'ml' : 'en';
  const missing = [];
  if (cleanText(title, 200).length < 4 || String(fullContent || '').trim().length < 40) {
    missing.push(LANGUAGE_NAMES[primary]);
  }
  const version = translations?.[other] || {};
  if (cleanText(version.title, 200).length < 4 || String(version.fullContent || '').trim().length < 40) {
    missing.push(LANGUAGE_NAMES[other]);
  }
  return missing;
}

function assertBilingual(article) {
  const missing = missingLanguages(article);
  if (missing.length) {
    throw badRequest(`Add the ${missing.join(' and ')} version (title and full story) before publishing.`);
  }
}

/** Board sign-off means the translation was checked by a person. */
function markTranslationsReviewed(translations) {
  const out = { ...(translations || {}) };
  for (const code of ['en', 'ml']) {
    if (out[code]) out[code] = { ...out[code], machineAssisted: false, reviewedAt: new Date().toISOString() };
  }
  return out;
}

function asTags(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return list.map(tag => cleanText(tag, 32)).filter(Boolean).slice(0, 8);
}

export function validateEditorialInput(body, { partial = false } = {}) {
  const title = cleanText(body.title, 200);
  const summary = cleanText(body.summary, 500);
  const fullContent = String(body.fullContent || body.full_content || '').trim().slice(0, 50000);
  const category = cleanText(body.category, 40) || 'india';
  const language = body.language === 'ml' ? 'ml' : 'en';
  const author = cleanText(body.author, 80);
  const authorSlug = slugify(body.authorSlug || '') || null;
  const authorPhotoUrl = cleanText(body.authorPhotoUrl || body.author_photo_url, 500);
  const authorTitle = cleanText(body.authorTitle || body.author_title, 80);
  const imageUrl = cleanText(body.imageUrl, 500);
  const imageCredit = cleanText(body.imageCredit, 180);
  const other = body.translation && typeof body.translation === 'object' ? body.translation : null;

  if (!partial || body.title !== undefined) {
    if (title.length < 8) return { error: 'Title must be at least 8 characters.' };
  }
  if (!partial || body.fullContent !== undefined || body.full_content !== undefined) {
    if (fullContent.length < 40) return { error: 'Full content must be at least 40 characters.' };
  }
  if (!CATEGORIES.has(category)) return { error: 'Choose a valid category.' };
  if (!partial || body.author !== undefined) {
    if (author.length < 2) return { error: 'Add an author name.' };
  }
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return { error: 'Cover image must be an http(s) URL.' };

  let scheduledAt = null;
  if (body.scheduledAt) {
    const when = new Date(body.scheduledAt);
    if (Number.isNaN(when.getTime())) return { error: 'Schedule date is invalid.' };
    scheduledAt = when.toISOString();
  }

  const translation = other && (other.title || other.fullContent)
    ? {
      lang: other.lang === 'en' ? 'en' : 'ml',
      title: cleanText(other.title, 200),
      summary: cleanText(other.summary, 500),
      fullContent: String(other.fullContent || '').trim().slice(0, 50000),
    }
    : null;

  return {
    value: {
      title,
      summary,
      fullContent,
      category,
      language,
      author,
      authorSlug,
      authorPhotoUrl: authorPhotoUrl && /^https?:\/\//i.test(authorPhotoUrl) ? authorPhotoUrl : '',
      authorTitle,
      imageUrl,
      imageCredit,
      tags: asTags(body.tags),
      scheduledAt,
      translation,
    },
  };
}

async function withResolvedStaffAuthor(input) {
  const resolved = await resolveStaffAuthor({
    author: input.author,
    authorSlug: input.authorSlug,
  });
  return {
    ...input,
    author: resolved.author || input.author,
    authorSlug: resolved.authorSlug || input.authorSlug,
    authorPhotoUrl: input.authorPhotoUrl || resolved.authorPhotoUrl || '',
    authorTitle: input.authorTitle || resolved.authorTitle || '',
  };
}

async function uniqueSlug(supabase, title, ignoreId) {
  const base = slugify(title) || `desk-${Date.now()}`;
  let candidate = base;
  for (let n = 2; n < 40; n += 1) {
    const { data } = await supabase.from('articles').select('id').eq('slug', candidate).maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
    candidate = `${base}-${n}`.slice(0, 70);
  }
  return `${base}-${Date.now()}`.slice(0, 70);
}

function translationMap(primaryLang, translation) {
  if (!translation?.fullContent && !translation?.title) return {};
  const lang = translation.lang && translation.lang !== primaryLang
    ? translation.lang
    : (primaryLang === 'en' ? 'ml' : 'en');
  return {
    [lang]: {
      title: translation.title || '',
      summary: translation.summary || '',
      fullContent: translation.fullContent || '',
      machineAssisted: true,
      provider: 'claude-cowork',
      updatedAt: new Date().toISOString(),
    },
  };
}

async function writeRow(supabase, mode, payload, id) {
  let row = { ...payload };
  for (let attempt = 0; attempt < OPTIONAL_COLUMNS.length + 1; attempt += 1) {
    const query = mode === 'insert'
      ? supabase.from('articles').insert(row).select('*').single()
      : supabase.from('articles').update(row).eq('id', id).select('*').single();
    const { data, error } = await query;
    if (!error) return data;
    const missing = OPTIONAL_COLUMNS.find(col => error.message?.includes(col) && col in row);
    if (!missing) {
      const err = new Error(error.message || 'Could not save the article.');
      if (/column .* does not exist/i.test(error.message || '')) {
        err.hint = 'Run supabase/migrations/20261109000000_editorial_desk.sql in the Supabase SQL editor.';
      }
      throw err;
    }
    const next = { ...row };
    delete next[missing];
    row = next;
  }
  throw new Error('Could not save the article.');
}

export async function createEditorialArticle(input, editor, { publishNow = false, autoAssign = false, publishing = null } = {}) {
  const supabase = getSupabaseAdmin();
  const resolved = await withResolvedStaffAuthor(input);
  let translations = translationMap(resolved.language, resolved.translation);
  let byline = {
    author: resolved.author,
    author_slug: resolved.authorSlug,
    author_photo_url: resolved.authorPhotoUrl || '',
    author_title: resolved.authorTitle || '',
  };
  let category = resolved.category;
  if (publishNow) {
    if (!publishing) throw badRequest('Choose the editorial board member and confirm the category before publishing.');
    assertBilingual({ ...resolved, translations });
    byline = await resolveBoardMember(supabase, publishing.publisherSlug);
    category = publishing.category;
    translations = markTranslationsReviewed(translations);
  }
  const slug = await uniqueSlug(supabase, resolved.title);
  const now = new Date().toISOString();

  // Auto-assign to an editor based on category + topic mapping.
  let assignedTo = null;
  let assignedAt = null;
  if (!publishNow && autoAssign) {
    try {
      assignedTo = await resolveAssignee(resolved.category);
      if (assignedTo) assignedAt = now;
    } catch {
      // Assignment is best-effort; don't block the draft.
    }
  }

  const data = await writeRow(supabase, 'insert', {
    title: resolved.title,
    slug,
    summary: resolved.summary || resolved.fullContent.slice(0, 220),
    full_content: resolved.fullContent,
    image_url: resolved.imageUrl || '',
    image_credit: resolved.imageCredit || '',
    category,
    source: 'Bharath News Editorial',
    ...byline,
    language: resolved.language,
    topics: resolved.tags,
    editorial_status: publishNow ? 'published' : 'draft',
    published_at: publishNow ? now : null,
    is_citizen_content: false,
    is_ai_assisted: false,
    editor_notes: '',
    revision_count: 0,
    scheduled_at: resolved.scheduledAt,
    submitted_by: editor.uid,
    assigned_to: assignedTo,
    assigned_at: assignedAt,
    translations,
    views: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    score: 6,
  });

  const article = rowToApp(data);
  if (publishNow) await onArticlePublished({ ...article, editorialStatus: 'published' });
  return article;
}

export async function updateEditorialArticle(id, input) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
  if (!existing) {
    const err = new Error('Article not found.');
    err.status = 404;
    throw err;
  }
  if (existing.editorial_status === 'published') {
    const err = new Error('Published articles stay as they are. Save a new draft to replace the wording.');
    err.status = 409;
    throw err;
  }

  const resolved = await withResolvedStaffAuthor(input);
  const slug = resolved.title ? await uniqueSlug(supabase, resolved.title, id) : existing.slug;
  const translations = {
    ...(existing.translations || {}),
    ...translationMap(resolved.language || existing.language, resolved.translation),
  };
  const data = await writeRow(supabase, 'update', {
    title: resolved.title,
    slug,
    summary: resolved.summary || resolved.fullContent.slice(0, 220),
    full_content: resolved.fullContent,
    image_url: resolved.imageUrl || '',
    image_credit: resolved.imageCredit || '',
    category: resolved.category,
    author: resolved.author,
    author_slug: resolved.authorSlug,
    author_photo_url: resolved.authorPhotoUrl || '',
    author_title: resolved.authorTitle || '',
    language: resolved.language,
    topics: resolved.tags,
    is_ai_assisted: false,
    scheduled_at: resolved.scheduledAt,
    translations,
    revision_count: (existing.revision_count || 0) + 1,
  }, id);
  return rowToApp(data);
}

export async function listEditorialArticles({ status = 'draft', mine = null, assignedTo = null, unassigned = false, limit = 40 } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('articles').select('*').eq('source', 'Bharath News Editorial').order('created_at', { ascending: false }).limit(limit);
  if (status === 'queue') query = query.in('editorial_status', ['draft', 'needs_revision']);
  else if (status !== 'all') query = query.eq('editorial_status', status);
  if (mine) query = query.eq('submitted_by', mine);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);
  if (unassigned) query = query.is('assigned_to', null);
  const { data, error } = await query;
  if (error) throw error;
  return rowsToApp(data || []);
}

export async function getEditorialArticle(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToApp(data) : null;
}

export async function reviewEditorialArticle(id, { action, notes, publishing = null }) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!existing) {
    const err = new Error('Article not found.');
    err.status = 404;
    throw err;
  }

  const now = new Date().toISOString();
  let patch = { editor_notes: notes || existing.editor_notes || '' };

  if (action === 'publish') {
    if (!publishing) throw badRequest('Choose the editorial board member and confirm the category before publishing.');
    assertBilingual({
      language: existing.language,
      title: existing.title,
      fullContent: existing.full_content,
      translations: existing.translations,
    });
    const byline = await resolveBoardMember(supabase, publishing.publisherSlug);
    patch = {
      ...patch,
      ...byline,
      category: publishing.category,
      is_ai_assisted: false,
      translations: markTranslationsReviewed(existing.translations),
      editorial_status: 'published',
      published_at: existing.published_at || now,
    };
  } else if (action === 'needs_revision') {
    patch = { ...patch, editorial_status: 'needs_revision', revision_count: (existing.revision_count || 0) + 1 };
  } else if (action === 'reject') {
    patch = { ...patch, editorial_status: 'rejected' };
  } else {
    const err = new Error('Unknown review action.');
    err.status = 400;
    throw err;
  }

  const saved = await writeRow(supabase, 'update', patch, id);
  const article = rowToApp(saved);
  if (action === 'publish') await onArticlePublished({ ...article, editorialStatus: 'published' });
  return article;
}

export async function publishDueDrafts() {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('editorial_status', 'draft')
    .lte('scheduled_at', now)
    .limit(20);
  if (error) {
    if (/scheduled_at/.test(error.message || '')) return [];
    throw error;
  }

  const published = [];
  const skipped = [];
  for (const row of data || []) {
    const missing = missingLanguages({
      language: row.language,
      title: row.title,
      fullContent: row.full_content,
      translations: row.translations,
    });
    if (missing.length) {
      skipped.push({ id: row.id, title: row.title, reason: `Missing the ${missing.join(' and ')} version.` });
      continue;
    }
    let byline;
    try {
      byline = row.author_slug ? await resolveBoardMember(supabase, row.author_slug) : null;
    } catch {
      byline = null;
    }
    if (!byline) {
      skipped.push({ id: row.id, title: row.title, reason: 'The byline is not an active editorial board member.' });
      continue;
    }
    const saved = await writeRow(supabase, 'update', {
      ...byline,
      is_ai_assisted: false,
      translations: markTranslationsReviewed(row.translations),
      editorial_status: 'published',
      published_at: now,
    }, row.id);
    const article = rowToApp(saved);
    await onArticlePublished({ ...article, editorialStatus: 'published' });
    published.push(article);
  }
  return { published, skipped };
}

// ── Content assignment ──

/**
 * Find the least-loaded editor whose assigned topics include this category.
 * Drafts with no matching editor stay unassigned.
 */
export async function resolveAssignee(category) {
  const supabase = getSupabaseAdmin();
  const { data: editors, error } = await supabase
    .from('staff_profiles')
    .select('user_id, assigned_topics')
    .eq('is_active', true)
    .not('user_id', 'is', null);
  if (error || !editors?.length) return null;

  // Filter empty topic lists in JS. PostgREST array equality filters do not reliably match TEXT[].
  const withTopics = editors.filter(editor => Array.isArray(editor.assigned_topics) && editor.assigned_topics.length > 0);
  const matching = withTopics.filter(editor => editor.assigned_topics.includes(category));
  if (!matching.length) return null;
  const pool = matching;

  // Round-robin: pick the editor with the fewest unfinished assignments.
  const userIds = pool.map(e => e.user_id);
  const { data: counts } = await supabase
    .from('articles')
    .select('assigned_to')
    .in('assigned_to', userIds)
    .in('editorial_status', ['draft', 'needs_revision']);

  const load = new Map(userIds.map(id => [id, 0]));
  for (const row of counts || []) {
    if (row.assigned_to) load.set(row.assigned_to, (load.get(row.assigned_to) || 0) + 1);
  }

  let best = userIds[0];
  let min = load.get(best) ?? 0;
  for (const uid of userIds) {
    const n = load.get(uid) ?? 0;
    if (n < min) { best = uid; min = n; }
  }
  return best;
}

export async function assignArticle(articleId, userId) {
  const supabase = getSupabaseAdmin();
  const now = userId ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from('articles')
    .update({ assigned_to: userId || null, assigned_at: now })
    .eq('id', articleId)
    .select('*')
    .single();
  if (error) {
    if (/assigned_to|assigned_at/.test(error.message || '')) return null;
    throw new Error(error.message || 'Could not assign article.');
  }
  return rowToApp(data);
}

export async function editorialStats() {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [queue, publishedWeek, recent] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }).in('editorial_status', ['draft', 'needs_revision']),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('source', 'Bharath News Editorial').eq('editorial_status', 'published').gte('published_at', since),
    supabase.from('articles').select('id, title, author, editorial_status, language, published_at, created_at').eq('source', 'Bharath News Editorial').order('created_at', { ascending: false }).limit(8),
  ]);
  return {
    queue: queue.count || 0,
    publishedWeek: publishedWeek.count || 0,
    recent: rowsToApp(recent.data || []),
  };
}

// ── Cowork ingest logging ──

export async function logCoworkIngest({ articleCount, errorCount, source = 'cowork', details = {} }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('cowork_ingest_log').insert({
    article_count: articleCount,
    error_count: errorCount,
    source,
    details,
  });
  if (error) console.error('cowork_ingest_log:', error.message);
}

export async function getCoworkIngestActivity() {
  const supabase = getSupabaseAdmin();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [recent, day, week] = await Promise.all([
    supabase.from('cowork_ingest_log').select('*').order('received_at', { ascending: false }).limit(5),
    supabase.from('cowork_ingest_log').select('article_count, error_count').gte('received_at', since24h),
    supabase.from('cowork_ingest_log').select('article_count, error_count').gte('received_at', since7d),
  ]);

  const failed = [recent.error, day.error, week.error].find(Boolean);
  if (failed) throw new Error(failed.message || 'Could not load cowork activity.');

  const sumField = (rows, field) => (rows || []).reduce((acc, r) => acc + (r[field] || 0), 0);

  const recentEntries = rowsToApp(recent.data || []);
  const lastReceived = recent.data?.[0]?.received_at || null;

  return {
    lastReceived,
    today: { articles: sumField(day.data, 'article_count'), errors: sumField(day.data, 'error_count'), batches: (day.data || []).length },
    week: { articles: sumField(week.data, 'article_count'), errors: sumField(week.data, 'error_count'), batches: (week.data || []).length },
    recent: recentEntries,
  };
}
