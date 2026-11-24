import { getSupabaseAdmin } from './supabase-server';
import { slugify } from '@/utils/slugify';
import { rowToApp, rowsToApp } from '@/lib/db-mapper';
import { onArticlePublished } from '@/lib/on-article-published';
import { resolveStaffAuthor } from '@/lib/staff-profiles';
import { SOURCE_CATEGORY_IDS } from '@/config/category-taxonomy';
import { readSiteSettings } from '@/lib/site-settings';
import { recordAudit, snapshotArticle } from '@/lib/audit-log';
import { findOpenImage } from '@/lib/open-images';
import { publicationLanguage, withAutomaticPartner } from '@/lib/english-draft';
import { translationMatchesTarget } from '../../shared/publication-lang.mjs';

const OPTIONAL_COLUMNS = [
  'is_ai_assisted', 'editor_notes', 'revision_count', 'scheduled_at', 'submitted_by',
  'image_credit', 'author_photo_url', 'author_title',
  'assigned_to', 'assigned_at', 'correction_note', 'unpublished_at', 'skip_english',
  'skip_malayalam', 'categories',
];

const CATEGORIES = new Set(SOURCE_CATEGORY_IDS);

async function newsroomContext() {
  const supabase = getSupabaseAdmin();
  const settings = await readSiteSettings(supabase);
  const languages = settings.newsroom.languages;
  return {
    supabase,
    source: settings.newsroom.editorialSource,
    languages,
    names: Object.fromEntries(languages.map(item => [item.code, item.label])),
    pageSize: settings.newsroom.reviewPageSize,
    defaultCategory: settings.newsroom.defaultCategory,
  };
}

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
  const categories = chosenCategories(body, '');
  if (!publisherSlug) return { error: 'Choose the editorial board member publishing this story.' };
  if (!categories.length) return { error: 'Confirm a valid category before publishing.' };
  const skipEnglish = body && Object.prototype.hasOwnProperty.call(body, 'skipEnglish')
    ? body.skipEnglish === true
    : null;
  const skipMalayalam = body && Object.prototype.hasOwnProperty.call(body, 'skipMalayalam')
    ? body.skipMalayalam === true
    : null;
  return { value: { publisherSlug, category: categories[0], categories, skipEnglish, skipMalayalam } };
}

function chosenCategories(body, fallback) {
  const raw = Array.isArray(body?.categories) ? body.categories : [];
  const picked = raw.map(item => cleanText(item, 40)).filter(item => CATEGORIES.has(item));
  const single = cleanText(body?.category, 40);
  const list = [...new Set(picked.length ? picked : (CATEGORIES.has(single) ? [single] : []))];
  if (!list.length && CATEGORIES.has(fallback)) list.push(fallback);
  return list.slice(0, 4);
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

/** Required languages must be complete and in the right script. Either language can be waived when it is not the story's own language. */
function missingLanguages(article, languages = []) {
  const codes = languages.length ? languages : [{ code: 'en', label: 'English' }, { code: 'ml', label: 'Malayalam' }];
  const tagged = String(article.language || '').trim().toLowerCase();
  const detected = publicationLanguage(article);
  const primary = codes.some(item => item.code === detected)
    ? detected
    : (codes.some(item => item.code === tagged) ? tagged : codes[0].code);
  const waiveEnglish = article.skipEnglish === true && primary !== 'en';
  const waiveMalayalam = article.skipMalayalam === true && primary !== 'ml';
  const missing = [];
  for (const item of codes) {
    if (item.code === 'en' && waiveEnglish) continue;
    if (item.code === 'ml' && waiveMalayalam) continue;
    if (item.code === primary) {
      if (cleanText(article.title, 200).length < 4 || String(article.fullContent || '').trim().length < 40) missing.push(item.label);
      continue;
    }
    const version = article.translations?.[item.code] || {};
    const title = cleanText(version.title, 200);
    const body = String(version.fullContent || '').trim();
    if (title.length < 4 || body.length < 40 || !translationMatchesTarget(version.title, version.fullContent, item.code)) {
      missing.push(item.label);
    }
  }
  return missing;
}

function assertBilingual(article, languages) {
  const missing = missingLanguages(article, languages);
  if (!missing.length) return;
  const primary = publicationLanguage(article);
  const waitingForDraft = missing.length === 1 && (
    (missing[0] === 'English' && primary === 'ml' && article.skipEnglish !== true)
    || (missing[0] === 'Malayalam' && primary === 'en' && article.skipMalayalam !== true)
  );
  if (waitingForDraft) {
    throw badRequest(`The ${missing[0]} draft could not be prepared. Save the story again in a moment, or publish without that version.`);
  }
  throw badRequest(`Add the ${missing.join(' and ')} version (title and full story) before publishing.`);
}

function dropWaived(translations, { skipEnglish = false, skipMalayalam = false } = {}) {
  const out = { ...(translations || {}) };
  if (skipEnglish) delete out.en;
  if (skipMalayalam) delete out.ml;
  return out;
}

function resolveSkipFlags(story, requested, existing = {}) {
  const primary = publicationLanguage({
    language: story?.language ?? existing.language,
    title: story?.title ?? existing.title,
    summary: story?.summary ?? existing.summary,
    fullContent: story?.fullContent || story?.full_content || existing.fullContent || existing.full_content,
  });
  const skipEnglish = (requested.skipEnglish === null || requested.skipEnglish === undefined
    ? existing.skip_english === true
    : requested.skipEnglish === true) && primary !== 'en';
  const skipMalayalam = (requested.skipMalayalam === null || requested.skipMalayalam === undefined
    ? existing.skip_malayalam === true
    : requested.skipMalayalam === true) && primary !== 'ml';
  return { skipEnglish, skipMalayalam };
}

/** Board sign-off means a complete translation was checked by a person. */
function markTranslationsReviewed(translations, languages = [], flags = {}) {
  const out = dropWaived(translations, flags);
  const codes = languages.length ? languages.map(item => item.code) : ['en', 'ml'];
  for (const code of codes) {
    const version = out[code];
    if (!version) continue;
    const title = String(version.title || '').trim();
    const body = String(version.fullContent || '').trim();
    if (title.length < 4 || body.length < 40) continue;
    out[code] = { ...version, machineAssisted: false, reviewedAt: new Date().toISOString() };
  }
  return out;
}

function asTags(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return list.map(tag => cleanText(tag, 32)).filter(Boolean).slice(0, 8);
}

export function validateEditorialInput(body, { partial = false, languages = null, defaultCategory = 'india' } = {}) {
  const allowed = new Set((languages || [{ code: 'en' }, { code: 'ml' }]).map(item => item.code));
  const title = cleanText(body.title, 200);
  const summary = cleanText(body.summary, 500);
  const fullContent = String(body.fullContent || body.full_content || '').trim().slice(0, 50000);
  const categories = chosenCategories(body, defaultCategory);
  const category = categories[0] || defaultCategory;
  const requested = cleanText(body.language, 8);
  const language = allowed.has(requested) ? requested : (allowed.has('en') ? 'en' : [...allowed][0]);
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

  const otherCode = [...allowed].find(code => code !== language) || [...allowed][0];
  const requestedOther = cleanText(other?.lang, 8);
  const translation = other && (other.title || other.fullContent)
    ? {
      lang: allowed.has(requestedOther) ? requestedOther : otherCode,
      title: cleanText(other.title, 200),
      summary: cleanText(other.summary, 500),
      fullContent: String(other.fullContent || '').trim().slice(0, 50000),
    }
    : null;
  const translations = {};
  if (body.translations && typeof body.translations === 'object' && !Array.isArray(body.translations)) {
    for (const [code, version] of Object.entries(body.translations)) {
      if (!allowed.has(code) || code === language || !version || typeof version !== 'object') continue;
      const sourceHash = String(version.sourceHash || '');
      translations[code] = {
        title: cleanText(version.title, 200),
        summary: cleanText(version.summary, 500),
        fullContent: String(version.fullContent || '').trim().slice(0, 50000),
        sourceHash: /^[a-f0-9]{16}$/.test(sourceHash) ? sourceHash : '',
        provider: version.provider === 'google-nmt' || version.provider === 'mymemory' ? version.provider : '',
      };
    }
  }

  return {
    value: {
      title,
      summary,
      fullContent,
      category,
      categories,
      language,
      author,
      authorSlug,
      authorPhotoUrl: authorPhotoUrl && /^https?:\/\//i.test(authorPhotoUrl) ? authorPhotoUrl : '',
      authorTitle,
      imageUrl,
      imageCredit,
      skipEnglish: body && Object.prototype.hasOwnProperty.call(body, 'skipEnglish')
        ? body.skipEnglish === true && language !== 'en'
        : null,
      skipMalayalam: body && Object.prototype.hasOwnProperty.call(body, 'skipMalayalam')
        ? body.skipMalayalam === true && language !== 'ml'
        : null,
      tags: asTags(body.tags),
      scheduledAt,
      translation,
      translations,
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

function translationMap(primaryLang, translation, extras = null) {
  const out = {};
  const add = (lang, version) => {
    if (!lang || lang === primaryLang || !version) return;
    if (!version.fullContent && !version.title) return;
    out[lang] = {
      title: version.title || '',
      summary: version.summary || '',
      fullContent: version.fullContent || '',
      machineAssisted: true,
      provider: version.provider === 'google-nmt' || version.provider === 'mymemory' ? version.provider : 'claude-cowork',
      sourceHash: /^[a-f0-9]{16}$/.test(String(version.sourceHash || '')) ? version.sourceHash : '',
      updatedAt: new Date().toISOString(),
    };
  };
  if (translation?.fullContent || translation?.title) {
    const lang = translation.lang && translation.lang !== primaryLang ? translation.lang : '';
    if (lang) add(lang, translation);
  }
  if (extras && typeof extras === 'object') {
    for (const [lang, version] of Object.entries(extras)) add(lang, version);
  }
  return out;
}

async function writeRow(supabase, mode, payload, id, matchRevision) {
  let row = { ...payload };
  delete row.updated_at;
  let compare = matchRevision;
  for (let attempt = 0; attempt < OPTIONAL_COLUMNS.length + 2; attempt += 1) {
    let query = mode === 'insert'
      ? supabase.from('articles').insert(row).select('*').single()
      : supabase.from('articles').update(row).eq('id', id);
    const comparing = mode !== 'insert' && compare !== undefined;
    if (comparing) {
      query = compare === null ? query.is('revision_count', null) : query.eq('revision_count', compare);
    }
    if (mode !== 'insert') query = comparing ? query.select('*') : query.select('*').single();
    const { data, error } = await query;
    if (!error) return comparing ? (data?.[0] || null) : data;
    const message = error.message || '';
    if (/updated_at/i.test(message) && /schema cache|does not exist/i.test(message)) {
      delete row.updated_at;
      continue;
    }
    if (comparing && /revision_count/i.test(message) && /schema cache|does not exist/i.test(message)) {
      compare = undefined;
      delete row.revision_count;
      continue;
    }
    const missing = OPTIONAL_COLUMNS.find(col => error.message?.includes(col) && col in row);
    if (missing === 'skip_english' && row.skip_english === true) {
      const err = new Error('Skipping English needs the skip_english column.');
      err.hint = 'Run supabase/migrations/20261124160000_skip_english.sql in the Supabase SQL editor.';
      err.status = 500;
      throw err;
    }
    if (missing === 'skip_malayalam' && row.skip_malayalam === true) {
      const err = new Error('Publishing in English only needs the skip_malayalam column.');
      err.hint = 'Run supabase/migrations/20261124180000_skip_malayalam.sql in the Supabase SQL editor.';
      err.status = 500;
      throw err;
    }
    if (missing === 'categories' && Array.isArray(row.categories) && row.categories.length > 1) {
      const err = new Error('More than one category needs the categories column.');
      err.hint = 'Run supabase/migrations/20261124170000_article_categories.sql in the Supabase SQL editor.';
      err.status = 500;
      throw err;
    }
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
  const { supabase, source, languages } = await newsroomContext();
  const resolved = await withResolvedStaffAuthor(input);
  const flags = resolveSkipFlags(resolved, resolved, {});
  let translations = await withAutomaticPartner({
    language: resolved.language,
    title: resolved.title,
    summary: resolved.summary,
    fullContent: resolved.fullContent,
    ...flags,
    translations: dropWaived(
      translationMap(resolved.language, resolved.translation, resolved.translations),
      flags,
    ),
  });
  let byline = {
    author: resolved.author,
    author_slug: resolved.authorSlug,
    author_photo_url: resolved.authorPhotoUrl || '',
    author_title: resolved.authorTitle || '',
  };
  let categories = resolved.categories?.length ? resolved.categories : [resolved.category];
  let category = categories[0];
  if (publishNow) {
    if (!publishing) throw badRequest('Choose the editorial board member and confirm the category before publishing.');
    assertBilingual({ ...resolved, translations, ...flags }, languages);
    byline = await resolveBoardMember(supabase, publishing.publisherSlug);
    categories = publishing.categories?.length ? publishing.categories : [publishing.category];
    category = categories[0];
    translations = markTranslationsReviewed(translations, languages, flags);
  }
  let imageUrl = resolved.imageUrl || '';
  let imageCredit = resolved.imageCredit || '';
  if (!imageUrl) {
    const open = await findOpenImage({ title: resolved.title, category, timeoutMs: 2500, fallback: false });
    if (open?.url) {
      imageUrl = open.url;
      imageCredit = imageCredit || open.credit;
    }
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
    image_url: imageUrl,
    image_credit: imageCredit,
    skip_english: flags.skipEnglish,
    skip_malayalam: flags.skipMalayalam,
    category,
    categories,
    source,
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
  await recordAudit({
    actorId: editor.uid,
    action: publishNow ? 'publish' : 'draft',
    entityType: 'article',
    entityId: article.id,
    summary: article.title,
  }, supabase);
  return article;
}

export async function updateEditorialArticle(id, input, { actorId = null, allowPublished = false } = {}) {
  const { supabase } = await newsroomContext();
  const { data: existing } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
  if (!existing) {
    const err = new Error('Article not found.');
    err.status = 404;
    throw err;
  }
  if (existing.editorial_status === 'published' && !allowPublished) {
    const err = new Error('Published articles stay as they are. Save a correction instead.');
    err.status = 409;
    throw err;
  }
  if (allowPublished) {
    await snapshotArticle(existing, { actorId, reason: 'correct' }, supabase);
  }

  const resolved = await withResolvedStaffAuthor(input);
  const slug = resolved.title ? await uniqueSlug(supabase, resolved.title, id) : existing.slug;
  const language = resolved.language || existing.language;
  const flags = resolveSkipFlags({ ...resolved, language }, resolved, existing);
  const translations = await withAutomaticPartner({
    language,
    title: resolved.title,
    summary: resolved.summary,
    fullContent: resolved.fullContent,
    ...flags,
    translations: dropWaived({
      ...(existing.translations || {}),
      ...translationMap(language, resolved.translation, resolved.translations),
    }, flags),
  });
  const data = await writeRow(supabase, 'update', {
    title: resolved.title,
    slug,
    summary: resolved.summary || resolved.fullContent.slice(0, 220),
    full_content: resolved.fullContent,
    image_url: resolved.imageUrl || '',
    image_credit: resolved.imageCredit || '',
    skip_english: flags.skipEnglish,
    skip_malayalam: flags.skipMalayalam,
    category: resolved.category,
    categories: resolved.categories?.length ? resolved.categories : [resolved.category],
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
    ...(allowPublished ? { correction_note: cleanText(input.correctionNote, 500) || existing.correction_note || '' } : {}),
  }, id);
  const article = rowToApp(data);
  if (allowPublished) {
    await recordAudit({
      actorId,
      action: 'correct',
      entityType: 'article',
      entityId: id,
      summary: article.title,
    }, supabase);
  }
  return article;
}

const DESK_STATUSES = ['draft', 'needs_revision', 'published', 'rejected', 'unpublished'];
const DESK_LIST_COLUMNS = [
  'id', 'title', 'slug', 'summary', 'author', 'author_slug', 'language', 'category',
  'categories', 'editorial_status', 'image_url', 'assigned_to', 'created_at',
  'published_at', 'scheduled_at', 'skip_english', 'skip_malayalam', 'submitted_by',
  'editor_notes', 'correction_note', 'translations',
];
const DESK_LIST_OPTIONAL = [
  'categories', 'skip_english', 'skip_malayalam', 'assigned_to', 'scheduled_at',
  'submitted_by', 'editor_notes', 'correction_note',
];

function statusesForList(status) {
  if (status === 'queue') return ['draft', 'needs_revision'];
  if (!status || status === 'all') return DESK_STATUSES;
  return [status];
}

async function selectDeskList(makeQuery) {
  let columns = [...DESK_LIST_COLUMNS];
  for (let attempt = 0; attempt <= DESK_LIST_OPTIONAL.length; attempt += 1) {
    const result = await makeQuery(columns.join(','));
    if (!result.error) return result.data || [];
    const missing = DESK_LIST_OPTIONAL.find(column => result.error.message?.includes(column) && columns.includes(column));
    if (!missing) throw result.error;
    columns = columns.filter(column => column !== missing);
  }
  throw new Error('Could not load the desk.');
}

export async function listEditorialArticles({ status = 'draft', mine = null, assignedTo = null, unassigned = false, limit = 40, offset = 0 } = {}) {
  const { supabase, source, pageSize } = await newsroomContext();
  const size = Math.min(Math.max(limit || pageSize, 1), 100);
  const start = Math.max(offset || 0, 0);
  let statuses = statusesForList(status);
  if (mine) statuses = statuses.filter(item => item !== 'published');
  const rows = await selectDeskList(columns => {
    let query = supabase.from('articles').select(columns).eq('source', source);
    query = statuses.length === 1
      ? query.eq('editorial_status', statuses[0])
      : query.in('editorial_status', statuses);
    query = query.order('created_at', { ascending: false }).range(start, start + size - 1);
    if (mine) query = query.eq('submitted_by', mine);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (unassigned) query = query.is('assigned_to', null);
    return query;
  });
  return rowsToApp(rows);
}

export async function getEditorialArticle(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToApp(data) : null;
}

function partnerIsReady(language, translations, flags) {
  const primary = String(language || '').trim().toLowerCase();
  const code = primary === 'en' ? 'ml' : primary === 'ml' ? 'en' : '';
  if (!code) return true;
  if ((code === 'en' && flags.skipEnglish) || (code === 'ml' && flags.skipMalayalam)) return true;
  const version = translations?.[code] || {};
  return cleanText(version.title, 200).length >= 4
    && String(version.fullContent || '').trim().length >= 40
    && translationMatchesTarget(version.title, version.fullContent, code);
}

/** Fill the missing partner language for a draft. Saves it when the draft already exists. */
export async function prepareEditorialTranslation(input, id = null) {
  const title = cleanText(input.title, 200);
  const summary = cleanText(input.summary, 500);
  const fullContent = String(input.fullContent || '').trim().slice(0, 50000);
  const language = publicationLanguage({ language: input.language, title, summary, fullContent });
  const flags = {
    skipEnglish: input.skipEnglish === true && language !== 'en',
    skipMalayalam: input.skipMalayalam === true && language !== 'ml',
  };
  const partner = language === 'en' ? 'Malayalam' : 'English';
  if (title.length < 4 || fullContent.length < 40) {
    return {
      translations: input.translations || {},
      prepared: false,
      warning: 'Add a title and full story before preparing the other language.',
    };
  }

  const supabase = getSupabaseAdmin();
  let existing = null;
  if (id) {
    const { data, error } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) {
      const err = new Error('Article not found.');
      err.status = 404;
      throw err;
    }
    existing = data;
  }

  const translations = await withAutomaticPartner({
    language,
    title,
    summary,
    fullContent,
    ...flags,
    force: input.force === true,
    translations: dropWaived({
      ...(existing?.translations || {}),
      ...(input.translations && typeof input.translations === 'object' ? input.translations : {}),
    }, flags),
  });

  let storedTranslations = dropWaived(translations, flags);
  let storedFlags = flags;
  if (existing && ['draft', 'needs_revision'].includes(existing.editorial_status)) {
    const { data: fresh, error: freshError } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
    if (freshError) throw freshError;
    if (fresh && ['draft', 'needs_revision'].includes(fresh.editorial_status)) {
      const changedDuringPrepare = [
        existing.revision_count ?? '',
        existing.title || '',
        existing.summary || '',
        existing.full_content || '',
        existing.language || '',
        existing.skip_english === true,
        existing.skip_malayalam === true,
      ].join('\u0001') !== [
        fresh.revision_count ?? '',
        fresh.title || '',
        fresh.summary || '',
        fresh.full_content || '',
        fresh.language || '',
        fresh.skip_english === true,
        fresh.skip_malayalam === true,
      ].join('\u0001');
      const storyChanged = changedDuringPrepare && (
        fresh.title !== existing.title
        || (fresh.summary || '') !== (existing.summary || '')
        || (fresh.full_content || '') !== (existing.full_content || '')
        || fresh.language !== existing.language
      );
      if (storyChanged) {
        const freshLanguage = publicationLanguage({
          language: fresh.language,
          title: fresh.title,
          summary: fresh.summary,
          fullContent: fresh.full_content,
        });
        storedFlags = {
          skipEnglish: fresh.skip_english === true && freshLanguage !== 'en',
          skipMalayalam: fresh.skip_malayalam === true && freshLanguage !== 'ml',
        };
        storedTranslations = fresh.translations || {};
      } else {
        const keepHandwritten = (saved, draft, activeFlags) => {
          const merged = { ...(saved || {}), ...dropWaived(draft, activeFlags) };
          for (const code of ['en', 'ml']) {
            if ((code === 'en' && activeFlags.skipEnglish) || (code === 'ml' && activeFlags.skipMalayalam)) continue;
            const previous = saved?.[code];
            const machine = previous?.provider === 'google-nmt' || previous?.provider === 'mymemory';
            const handwritten = previous
              && !machine
              && cleanText(previous.title, 200).length >= 4
              && String(previous.fullContent || '').trim().length >= 40
              && translationMatchesTarget(previous.title, previous.fullContent, code);
            if (handwritten) merged[code] = previous;
          }
          return dropWaived(merged, activeFlags);
        };
        const flagsFrom = (row, fallback) => {
          const rowLanguage = row
            ? publicationLanguage({
              language: row.language,
              title: row.title,
              summary: row.summary,
              fullContent: row.full_content,
            })
            : language;
          return {
            skipEnglish: (row ? row.skip_english === true : fallback.skipEnglish) && rowLanguage !== 'en',
            skipMalayalam: (row ? row.skip_malayalam === true : fallback.skipMalayalam) && rowLanguage !== 'ml',
          };
        };
        const storyMoved = (row) => row.title !== existing.title
          || (row.summary || '') !== (existing.summary || '')
          || (row.full_content || '') !== (existing.full_content || '')
          || row.language !== existing.language;
        const sourceRow = changedDuringPrepare ? fresh : null;
        storedFlags = flagsFrom(sourceRow, flags);
        storedTranslations = keepHandwritten(sourceRow?.translations, translations, storedFlags);
        const revisionToken = (row) => (row && Object.prototype.hasOwnProperty.call(row, 'revision_count')
          ? (row.revision_count ?? null)
          : undefined);
        const preparedPatch = (token) => {
          const patch = {
            translations: storedTranslations,
            skip_english: storedFlags.skipEnglish,
            skip_malayalam: storedFlags.skipMalayalam,
          };
          if (token !== undefined) patch.revision_count = (token || 0) + 1;
          return patch;
        };
        const freshToken = revisionToken(fresh);
        let written = await writeRow(supabase, 'update', preparedPatch(freshToken), id, freshToken);
        if (!written) {
          const { data: latest, error: latestError } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
          if (latestError) throw latestError;
          if (latest && ['draft', 'needs_revision'].includes(latest.editorial_status) && !storyMoved(latest)) {
            storedFlags = flagsFrom(latest, flags);
            storedTranslations = keepHandwritten(latest.translations, translations, storedFlags);
            const latestToken = revisionToken(latest);
            written = await writeRow(supabase, 'update', preparedPatch(latestToken), id, latestToken);
          }
          if (!written && latest) {
            storedFlags = flagsFrom(latest, flags);
            storedTranslations = latest.translations || {};
          }
        }
      }
    }
  }

  const prepared = partnerIsReady(language, storedTranslations, storedFlags);
  return {
    translations: storedTranslations,
    skipEnglish: storedFlags.skipEnglish,
    skipMalayalam: storedFlags.skipMalayalam,
    prepared,
    warning: prepared ? '' : `The ${partner} draft could not be prepared. You can publish without that version.`,
  };
}

export async function reviewEditorialArticle(id, { action, notes, publishing = null, actorId = null, correctionNote = '' }) {
  const { supabase, languages } = await newsroomContext();
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
    const flags = resolveSkipFlags(existing, publishing, existing);
    const translations = await withAutomaticPartner({
      language: existing.language,
      title: existing.title,
      summary: existing.summary,
      fullContent: existing.full_content,
      ...flags,
      translations: dropWaived(existing.translations || {}, flags),
    });
    assertBilingual({
      language: existing.language,
      title: existing.title,
      fullContent: existing.full_content,
      translations,
      ...flags,
    }, languages);
    const byline = await resolveBoardMember(supabase, publishing.publisherSlug);
    patch = {
      ...patch,
      ...byline,
      skip_english: flags.skipEnglish,
      skip_malayalam: flags.skipMalayalam,
      category: publishing.categories?.[0] || publishing.category,
      categories: publishing.categories?.length ? publishing.categories : [publishing.category],
      is_ai_assisted: false,
      translations: markTranslationsReviewed(translations, languages, flags),
      editorial_status: 'published',
      published_at: existing.published_at || now,
    };
  } else if (action === 'needs_revision') {
    patch = { ...patch, editorial_status: 'needs_revision', revision_count: (existing.revision_count || 0) + 1 };
  } else if (action === 'reject') {
    if (existing.editorial_status === 'published') throw badRequest('Unpublish a live story instead of rejecting it.');
    if (existing.editorial_status === 'rejected') throw badRequest('This story is already rejected.');
    if (cleanText(notes, 1000).length < 8) throw badRequest('Add a short note explaining why this story is rejected.');
    patch = { ...patch, editorial_status: 'rejected' };
  } else if (action === 'unpublish') {
    if (existing.editorial_status !== 'published') throw badRequest('Only a published story can be unpublished.');
    patch = { ...patch, editorial_status: 'unpublished', unpublished_at: now };
  } else if (action === 'correct') {
    if (existing.editorial_status !== 'published') throw badRequest('Corrections are for published stories.');
    const note = cleanText(correctionNote || notes, 500);
    if (note.length < 8) throw badRequest('Add a correction note readers can see.');
    patch = { ...patch, correction_note: note };
  } else {
    const err = new Error('Unknown review action.');
    err.status = 400;
    throw err;
  }

  await snapshotArticle(existing, { actorId, reason: action }, supabase);
  const saved = await writeRow(supabase, 'update', patch, id);
  const article = rowToApp(saved);
  if (action === 'publish') await onArticlePublished({ ...article, editorialStatus: 'published' });
  await recordAudit({
    actorId,
    action,
    entityType: 'article',
    entityId: id,
    summary: article.title,
  }, supabase);
  return article;
}

export async function publishDueDrafts() {
  const { supabase, source, languages } = await newsroomContext();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('source', source)
    .eq('editorial_status', 'draft')
    .lte('scheduled_at', now)
    .limit(20);
  if (error) {
    if (/scheduled_at/.test(error.message || '')) {
      const missing = new Error('Scheduled publishing needs the scheduled_at column. Run supabase/migrations/20261124140000_newsroom_controls.sql.');
      missing.status = 500;
      throw missing;
    }
    throw error;
  }

  const published = [];
  const skipped = [];
  for (const row of data || []) {
    const flags = resolveSkipFlags(row, {}, row);
    const translations = await withAutomaticPartner({
      language: row.language,
      title: row.title,
      summary: row.summary,
      fullContent: row.full_content,
      ...flags,
      translations: dropWaived(row.translations || {}, flags),
    });
    const missing = missingLanguages({
      language: row.language,
      title: row.title,
      fullContent: row.full_content,
      translations,
      ...flags,
    }, languages);
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
      translations: markTranslationsReviewed(translations, languages, flags),
      editorial_status: 'published',
      published_at: now,
    }, row.id);
    const article = rowToApp(saved);
    await onArticlePublished({ ...article, editorialStatus: 'published' });
    await recordAudit({
      action: 'publish',
      entityType: 'article',
      entityId: article.id,
      summary: article.title,
      detail: { scheduled: true },
    }, supabase);
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

export async function assignArticle(articleId, userId, { actorId = null } = {}) {
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
  await recordAudit({
    actorId,
    action: 'assign',
    entityType: 'article',
    entityId: articleId,
    summary: userId || 'unassigned',
  }, supabase);
  return rowToApp(data);
}

export async function editorialStats() {
  const { supabase, source } = await newsroomContext();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [queue, publishedWeek, ...recentBatches] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('source', source).in('editorial_status', ['draft', 'needs_revision']),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('source', source).eq('editorial_status', 'published').gte('published_at', since),
    ...DESK_STATUSES.map(status => supabase.from('articles')
      .select('id, title, slug, author, editorial_status, language, published_at, created_at')
      .eq('source', source)
      .eq('editorial_status', status)
      .order('created_at', { ascending: false })
      .limit(8)),
  ]);
  const recent = recentBatches.flatMap(result => result.data || []);
  recent.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return {
    queue: queue.count || 0,
    publishedWeek: publishedWeek.count || 0,
    recent: rowsToApp(recent.slice(0, 8)),
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
