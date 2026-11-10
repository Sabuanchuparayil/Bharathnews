import { rowsToApp } from '@/lib/db-mapper';
import { slugify } from '@/utils/slugify';

const SOURCE_CATEGORIES = new Set(['india', 'gcc', 'business', 'technology', 'sports', 'entertainment', 'health', 'education', 'jobs', 'realestate', 'world', 'lifestyle', 'opinion']);
const SOURCE_LANGUAGES = new Set(['en', 'hi', 'ml', 'ta', 'kn', 'te', 'bn']);
const SOURCE_TYPES = new Set(['rss', 'googlenews', 'youtube']);
const CREATOR_ROLES = new Set(['contributor', 'vlogger']);

export function sourceIdFromName(name) {
  const slug = String(name || 'source')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return slug || `source-${Date.now()}`;
}

export function sourceRowFromBody(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid source.' };
  }

  const row = {};
  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 160) return { error: 'Source name is required.' };
    row.name = name;
  }
  if (!partial || body.url !== undefined) {
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (url.length > 500) return { error: 'Feed URL is too long.' };
    row.url = url;
  }
  if (!partial || body.category !== undefined) {
    if (!SOURCE_CATEGORIES.has(body.category)) return { error: 'Invalid category.' };
    row.category = body.category;
  }
  if (!partial || body.language !== undefined) {
    if (!SOURCE_LANGUAGES.has(body.language)) return { error: 'Invalid language.' };
    row.language = body.language;
  }
  if (!partial || body.type !== undefined) {
    if (!SOURCE_TYPES.has(body.type)) return { error: 'Invalid source type.' };
    row.type = body.type;
  }
  if (body.region !== undefined) {
    if (typeof body.region !== 'string' || body.region.length > 80) return { error: 'Invalid region.' };
    row.region = body.region.trim();
  }
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') return { error: 'enabled must be true or false.' };
    row.enabled = body.enabled;
  }
  if (body.trustWeight !== undefined) {
    const weight = Number(body.trustWeight);
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) return { error: 'Trust weight must be between 0 and 1.' };
    row.trust_weight = weight;
  }

  if (!partial) {
    row.category = row.category || 'india';
    row.language = row.language || 'en';
    row.type = row.type || 'rss';
    row.enabled = row.enabled !== false;
    if (row.trust_weight === undefined) row.trust_weight = 0.85;
    if (row.region === undefined) row.region = '';
    if (row.url === undefined) row.url = '';
  }

  if (!Object.keys(row).length) return { error: 'Nothing to update.' };
  return { row };
}

export function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function normalizeStats(raw) {
  const pipeline = raw?.pipeline && typeof raw.pipeline === 'object' ? raw.pipeline : {};
  const counts = {};
  for (const [key, value] of Object.entries(pipeline)) counts[key] = asNumber(value);

  const mapFacet = (items) => (Array.isArray(items) ? items : []).map(item => ({
    name: String(item?.name || 'unknown'),
    count: asNumber(item?.count),
  }));

  return {
    totalArticles: asNumber(raw?.totalArticles),
    subscribers: asNumber(raw?.subscribers),
    users: asNumber(raw?.users),
    sources: asNumber(raw?.sources),
    enabledSources: asNumber(raw?.enabledSources),
    sourcesWithErrors: asNumber(raw?.sourcesWithErrors),
    distributionPending: asNumber(raw?.distributionPending),
    distributionFailed: asNumber(raw?.distributionFailed),
    pipeline: counts,
    byCategory: mapFacet(raw?.byCategory),
    byLanguage: mapFacet(raw?.byLanguage),
    topArticles: (Array.isArray(raw?.topArticles) ? raw.topArticles : []).map(article => ({
      id: article?.id,
      title: article?.title || 'Untitled',
      category: article?.category || '',
    })),
  };
}

async function uniqueCreatorSlug(supabase, displayName, email) {
  const base = slugify(displayName) || slugify((email || '').split('@')[0]) || 'creator';
  let candidate = base;
  let suffix = 1;
  while (suffix < 50) {
    const { data } = await supabase.from('creator_profiles').select('slug').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return `${base}-${Date.now()}`;
}

export async function reviewApplication(supabase, { id, approved, feedback, reviewerId }) {
  const { data: application, error } = await supabase
    .from('role_applications')
    .select('id, user_id, requested_role, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Could not load the application.');
  if (!application) {
    const missing = new Error('Application not found.');
    missing.status = 404;
    throw missing;
  }
  if (!CREATOR_ROLES.has(application.requested_role)) {
    const invalid = new Error('That role cannot be approved from the queue.');
    invalid.status = 400;
    throw invalid;
  }

  const { error: updateError } = await supabase.from('role_applications').update({
    status: approved ? 'approved' : 'rejected',
    feedback: feedback || '',
    reviewed_at: new Date().toISOString(),
  }).eq('id', id);
  if (updateError) throw new Error(updateError.message || 'Could not update the application.');

  if (!approved) return { ok: true };

  const { data: account } = await supabase
    .from('users')
    .select('id, email, display_name, photo_url, role')
    .eq('id', application.user_id)
    .maybeSingle();

  const { error: roleError } = await supabase
    .from('users')
    .update({ role: application.requested_role })
    .eq('id', application.user_id);
  if (roleError) throw new Error(roleError.message || 'Could not update the user role.');

  const { data: existingProfile } = await supabase
    .from('creator_profiles')
    .select('slug, follower_count, post_count, earnings_balance, revenue_share_eligible')
    .eq('user_id', application.user_id)
    .maybeSingle();

  const slug = existingProfile?.slug || await uniqueCreatorSlug(
    supabase,
    account?.display_name,
    account?.email,
  );

  const { error: profileError } = await supabase.from('creator_profiles').upsert({
    user_id: application.user_id,
    slug,
    display_name: account?.display_name || account?.email?.split('@')[0] || 'Creator',
    photo_url: account?.photo_url || '',
    bio: '',
    role: application.requested_role,
    follower_count: existingProfile?.follower_count || 0,
    post_count: existingProfile?.post_count || 0,
    earnings_balance: existingProfile?.earnings_balance || 0,
    revenue_share_eligible: existingProfile?.revenue_share_eligible || false,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw new Error(profileError.message || 'Could not create the creator profile.');

  return { ok: true, reviewerId };
}

export async function moderatePost(supabase, { id, approved, feedback }) {
  const { data: postRow, error } = await supabase.from('creator_posts').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message || 'Could not load the post.');
  if (!postRow) {
    const missing = new Error('Post not found.');
    missing.status = 404;
    throw missing;
  }

  const { error: updateError } = await supabase.from('creator_posts').update({
    status: approved ? 'published' : 'rejected',
    moderation_feedback: feedback || '',
    published_at: approved ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (updateError) throw new Error(updateError.message || 'Could not update the post.');

  if (!approved) return { ok: true, notify: null };

  if (postRow.author_slug) {
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('post_count')
      .eq('slug', postRow.author_slug)
      .maybeSingle();
    await supabase.from('creator_profiles').update({
      post_count: (profile?.post_count || 0) + 1,
    }).eq('slug', postRow.author_slug);
  }

  const isPublic = !postRow.visibility || postRow.visibility === 'public';
  if (postRow.type === 'article' && isPublic) {
    const { data: article, error: articleError } = await supabase.from('articles').insert({
      title: postRow.title,
      slug: `${postRow.author_slug}-${postRow.slug}`,
      summary: postRow.excerpt,
      full_content: postRow.body,
      image_url: postRow.cover_image || '',
      category: postRow.category,
      topics: postRow.tags,
      source: 'Bharath News Community',
      author: postRow.author_name,
      author_slug: postRow.author_slug,
      creator_post_id: id,
      is_citizen_content: true,
      editorial_status: 'published',
      published_at: new Date().toISOString(),
      views: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      score: 5,
    }).select('id').maybeSingle();
    if (articleError) throw new Error(articleError.message || 'Could not publish the article.');
    return { ok: true, notify: article?.id ? { articleId: article.id } : null };
  }

  if (isPublic) return { ok: true, notify: { creatorPostId: id } };
  return { ok: true, notify: null };
}

export function mapRows(rows) {
  return rowsToApp(rows || []);
}
