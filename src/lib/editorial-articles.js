import { getSupabaseAdmin } from './supabase-server';
import { slugify } from '@/utils/slugify';
import { rowToApp, rowsToApp } from '@/lib/db-mapper';
import { onArticlePublished } from '@/lib/on-article-published';

const OPTIONAL_COLUMNS = ['is_ai_assisted', 'editor_notes', 'revision_count', 'scheduled_at', 'submitted_by', 'image_credit'];

const CATEGORIES = new Set([
  'india', 'gcc', 'business', 'technology', 'sports', 'entertainment', 'health',
  'education', 'jobs', 'realestate', 'lifestyle', 'opinion', 'world', 'breaking',
]);

function cleanText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
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
      imageUrl,
      imageCredit,
      tags: asTags(body.tags),
      isAiAssisted: Boolean(body.isAiAssisted),
      scheduledAt,
      translation,
    },
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

export async function createEditorialArticle(input, editor, { publishNow = false } = {}) {
  const supabase = getSupabaseAdmin();
  const slug = await uniqueSlug(supabase, input.title);
  const now = new Date().toISOString();
  const data = await writeRow(supabase, 'insert', {
    title: input.title,
    slug,
    summary: input.summary || input.fullContent.slice(0, 220),
    full_content: input.fullContent,
    image_url: input.imageUrl || '',
    image_credit: input.imageCredit || '',
    category: input.category,
    source: 'Bharath News Editorial',
    author: input.author,
    author_slug: input.authorSlug,
    language: input.language,
    topics: input.tags,
    editorial_status: publishNow ? 'published' : 'draft',
    published_at: publishNow ? now : null,
    is_citizen_content: false,
    is_ai_assisted: input.isAiAssisted,
    editor_notes: '',
    revision_count: 0,
    scheduled_at: input.scheduledAt,
    submitted_by: editor.uid,
    translations: translationMap(input.language, input.translation),
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

  const slug = input.title ? await uniqueSlug(supabase, input.title, id) : existing.slug;
  const translations = {
    ...(existing.translations || {}),
    ...translationMap(input.language || existing.language, input.translation),
  };
  const data = await writeRow(supabase, 'update', {
    title: input.title,
    slug,
    summary: input.summary || input.fullContent.slice(0, 220),
    full_content: input.fullContent,
    image_url: input.imageUrl || '',
    image_credit: input.imageCredit || '',
    category: input.category,
    author: input.author,
    author_slug: input.authorSlug,
    language: input.language,
    topics: input.tags,
    is_ai_assisted: input.isAiAssisted,
    scheduled_at: input.scheduledAt,
    translations,
    revision_count: (existing.revision_count || 0) + 1,
  }, id);
  return rowToApp(data);
}

export async function listEditorialArticles({ status = 'draft', mine = null, limit = 40 } = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from('articles').select('*').eq('source', 'Bharath News Editorial').order('created_at', { ascending: false }).limit(limit);
  if (status === 'queue') query = query.in('editorial_status', ['draft', 'needs_revision']);
  else if (status !== 'all') query = query.eq('editorial_status', status);
  if (mine) query = query.eq('submitted_by', mine);
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

export async function reviewEditorialArticle(id, { action, notes }) {
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
    patch = { ...patch, editorial_status: 'published', published_at: existing.published_at || now };
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
  for (const row of data || []) {
    const saved = await writeRow(supabase, 'update', {
      editorial_status: 'published',
      published_at: now,
    }, row.id);
    const article = rowToApp(saved);
    await onArticlePublished({ ...article, editorialStatus: 'published' });
    published.push(article);
  }
  return published;
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
