'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';
import { rowToApp, rowsToApp } from '@/lib/db-mapper';
import { slugify } from '../utils/slugify';

const CREATOR_ROLES = ['contributor', 'vlogger'];

function sb() {
  const client = getSupabaseBrowser();
  if (!client) throw new Error('Database unavailable');
  return client;
}

async function notifyTelegramForArticle(articleId) {
  try {
    const supabase = getSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    await fetch('/api/articles/telegram-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ articleId }),
    });
  } catch {
    /* best-effort */
  }
}

export const isCreatorRole = (role) => CREATOR_ROLES.includes(role);

export const submitRoleApplication = async (userId, { requestedRole, bio, portfolioUrl, sampleWork }) => {
  const supabase = sb();
  const { data: existing } = await supabase
    .from('role_applications')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (existing?.length) throw new Error('PENDING_APPLICATION_EXISTS');

  const { error } = await supabase.from('role_applications').insert({
    user_id: userId,
    requested_role: requestedRole,
    bio: bio || '',
    portfolio_url: portfolioUrl || '',
    sample_work: sampleWork || '',
    status: 'pending',
  });
  if (error) throw error;
};

export const getPendingApplications = async (count = 50) => {
  const { data } = await sb()
    .from('role_applications')
    .select('*')
    .eq('status', 'pending')
    .limit(count);
  return rowsToApp(data || []).sort((a, b) =>
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );
};

export const getUserApplication = async (userId) => {
  const { data } = await sb()
    .from('role_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0] ? rowToApp(data[0]) : null;
};

export const reviewRoleApplication = async (applicationId, { approved, feedback, userId, requestedRole, displayName, photoURL }) => {
  const supabase = sb();
  await supabase.from('role_applications').update({
    status: approved ? 'approved' : 'rejected',
    feedback: feedback || '',
    reviewed_at: new Date().toISOString(),
  }).eq('id', applicationId);

  if (approved) {
    await supabase.from('users').update({ role: requestedRole }).eq('id', userId);
    const username = await generateUsername(displayName, '');
    await upsertCreatorProfile(userId, {
      slug: username,
      displayName,
      photoURL,
      role: requestedRole,
      bio: '',
    });
  }
};

export const generateUsername = async (displayName, email) => {
  let base = slugify(displayName) || slugify((email || '').split('@')[0]) || 'creator';
  let candidate = base;
  let suffix = 1;
  while (await getCreatorProfileBySlug(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export const upsertCreatorProfile = async (userId, data) => {
  const supabase = sb();
  const { data: existing } = await supabase.from('creator_profiles').select('*').eq('slug', data.slug).maybeSingle();

  const payload = {
    user_id: userId,
    slug: data.slug,
    display_name: data.displayName || '',
    photo_url: data.photoURL || '',
    bio: data.bio || '',
    cover_image: data.coverImage || '',
    role: data.role || 'contributor',
    social_links: data.socialLinks || {},
    verified: data.verified || false,
    follower_count: existing?.follower_count || 0,
    post_count: existing?.post_count || 0,
    earnings_balance: existing?.earnings_balance || 0,
    revenue_share_eligible: existing?.revenue_share_eligible || false,
    updated_at: new Date().toISOString(),
  };

  await supabase.from('creator_profiles').upsert(payload);
  const { data: saved } = await supabase.from('creator_profiles').select('*').eq('slug', data.slug).single();
  return rowToApp(saved);
};

export const getCreatorProfileBySlug = async (slug) => {
  const { data } = await sb().from('creator_profiles').select('*').eq('slug', slug).maybeSingle();
  return data ? rowToApp(data) : null;
};

export const getCreatorProfileByUserId = async (userId) => {
  const { data } = await sb().from('creator_profiles').select('*').eq('user_id', userId).limit(1).maybeSingle();
  return data ? rowToApp(data) : null;
};

export const updateCreatorProfile = async (slug, updates) => {
  const row = { updated_at: new Date().toISOString() };
  if (updates.bio !== undefined) row.bio = updates.bio;
  if (updates.coverImage !== undefined) row.cover_image = updates.coverImage;
  if (updates.socialLinks !== undefined) row.social_links = updates.socialLinks;
  await sb().from('creator_profiles').update(row).eq('slug', slug);
};

export const createCreatorPost = async (authorId, post) => {
  const profile = await getCreatorProfileByUserId(authorId);
  if (!profile) throw new Error('CREATOR_PROFILE_REQUIRED');

  const postSlug = slugify(post.title) || `post-${Date.now()}`;
  const { data, error } = await sb().from('creator_posts').insert({
    author_id: authorId,
    author_name: profile.displayName,
    author_slug: profile.slug,
    type: post.type,
    title: post.title,
    body: post.body,
    excerpt: (post.excerpt || post.body || '').slice(0, 200),
    cover_image: post.coverImage || '',
    video_url: post.videoUrl || '',
    category: post.category || 'opinion',
    tags: post.tags || [],
    status: post.status || 'pending',
    visibility: post.visibility || 'public',
    slug: postSlug,
  }).select('id').single();
  if (error) throw error;
  return { id: data.id };
};

export const updateCreatorPost = async (postId, updates) => {
  const row = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.body !== undefined) row.body = updates.body;
  if (updates.status !== undefined) row.status = updates.status;
  await sb().from('creator_posts').update(row).eq('id', postId);
};

export const getCreatorPost = async (postId) => {
  const { data } = await sb().from('creator_posts').select('*').eq('id', postId).maybeSingle();
  return data ? rowToApp(data) : null;
};

export const getCreatorPostsByAuthor = async (authorSlug, type = null, status = 'published') => {
  const { data } = await sb()
    .from('creator_posts')
    .select('*')
    .eq('author_slug', authorSlug)
    .eq('status', status)
    .limit(50);
  let posts = rowsToApp(data || []).sort((a, b) =>
    (b.publishedAt?.seconds || b.createdAt?.seconds || 0) - (a.publishedAt?.seconds || a.createdAt?.seconds || 0)
  );
  if (type) posts = posts.filter(p => p.type === type);
  return posts;
};

export const getMyCreatorPosts = async (authorId) => {
  const { data } = await sb()
    .from('creator_posts')
    .select('*')
    .eq('author_id', authorId)
    .limit(50);
  return rowsToApp(data || []).sort((a, b) =>
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );
};

export const getPendingCreatorPosts = async (count = 50) => {
  const { data } = await sb()
    .from('creator_posts')
    .select('*')
    .eq('status', 'pending')
    .limit(count);
  return rowsToApp(data || []).sort((a, b) =>
    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );
};

export const moderateCreatorPost = async (postId, { approved, feedback }) => {
  const supabase = sb();
  const { data: postRow } = await supabase.from('creator_posts').select('*').eq('id', postId).single();
  if (!postRow) throw new Error('POST_NOT_FOUND');
  const post = rowToApp(postRow);

  await supabase.from('creator_posts').update({
    status: approved ? 'published' : 'rejected',
    moderation_feedback: feedback || '',
    published_at: approved ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', postId);

  if (approved) {
    const { data: profile } = await supabase.from('creator_profiles').select('post_count').eq('slug', post.authorSlug).single();
    await supabase.from('creator_profiles').update({
      post_count: (profile?.post_count || 0) + 1,
    }).eq('slug', post.authorSlug);

    if (post.type === 'article' && post.visibility === 'public') {
      const { data: article } = await supabase.from('articles').insert({
        title: post.title,
        slug: `${post.authorSlug}-${post.slug}`,
        summary: post.excerpt,
        full_content: post.body,
        image_url: post.coverImage || '',
        category: post.category,
        topics: post.tags,
        source: 'Bharath News Community',
        author: post.authorName,
        author_slug: post.authorSlug,
        creator_post_id: postId,
        is_citizen_content: true,
        editorial_status: 'published',
        published_at: new Date().toISOString(),
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        score: 5,
      }).select('id').single();
      if (article?.id) notifyTelegramForArticle(article.id);
    }
  }
};

export const followCreator = async (followerId, creatorSlug) => {
  const supabase = sb();
  const followId = `${followerId}_${creatorSlug}`;
  const { data: existing } = await supabase.from('follows').select('id').eq('id', followId).maybeSingle();
  if (existing) return false;

  await supabase.from('follows').insert({ id: followId, follower_id: followerId, creator_slug: creatorSlug, active: true });
  const { data: profile } = await supabase.from('creator_profiles').select('follower_count').eq('slug', creatorSlug).single();
  await supabase.from('creator_profiles').update({
    follower_count: (profile?.follower_count || 0) + 1,
  }).eq('slug', creatorSlug);
  return true;
};

export const unfollowCreator = async (followerId, creatorSlug) => {
  const supabase = sb();
  const followId = `${followerId}_${creatorSlug}`;
  const { data: existing } = await supabase.from('follows').select('id').eq('id', followId).maybeSingle();
  if (!existing) return false;

  await supabase.from('follows').update({ active: false }).eq('id', followId);
  const { data: profile } = await supabase.from('creator_profiles').select('follower_count').eq('slug', creatorSlug).single();
  await supabase.from('creator_profiles').update({
    follower_count: Math.max(0, (profile?.follower_count || 0) - 1),
  }).eq('slug', creatorSlug);
  return true;
};

export const isFollowing = async (followerId, creatorSlug) => {
  const { data } = await sb().from('follows').select('active').eq('id', `${followerId}_${creatorSlug}`).maybeSingle();
  return data?.active !== false && !!data;
};

export const getFeaturedCreators = async (count = 6) => {
  const { data } = await sb().from('creator_profiles').select('*').limit(20);
  return rowsToApp(data || [])
    .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
    .slice(0, count);
};

export const checkRevenueShareEligibility = async (creatorSlug) => {
  const profile = await getCreatorProfileBySlug(creatorSlug);
  if (!profile) return false;
  const posts = await getCreatorPostsByAuthor(creatorSlug);
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const eligible = totalViews >= 10000 && posts.length >= 5;
  if (eligible && !profile.revenueShareEligible) {
    await updateCreatorProfile(creatorSlug, { revenueShareEligible: true });
  }
  return eligible;
};
