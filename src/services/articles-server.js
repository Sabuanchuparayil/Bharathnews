import { getSupabaseAdmin, getSupabaseServer } from '@/lib/supabase-server';
import { rowToApp, rowsToApp, serializeDoc } from '@/lib/db-mapper';

export { serializeDoc };

export async function getArticleBySlugServer(slug) {
  const decoded = decodeURIComponent(slug || '');
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('articles').select('*').eq('slug', decoded).limit(1).maybeSingle();
  if (!data) return null;
  return serializeDoc(rowToApp(data));
}

export async function getTrendingArticlesServer(count = 5) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('articles')
    .select('*')
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('views', { ascending: false })
    .limit(count);
  return rowsToApp(data || []).map(serializeDoc);
}

export async function getArticlesPageServer(category = null, pageSize = 20) {
  const supabase = await getSupabaseServer();
  let query = supabase
    .from('articles')
    .select('*')
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('created_at', { ascending: false })
    .limit(pageSize);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data } = await query;
  const articles = rowsToApp(data || []).map(serializeDoc);
  return { articles, hasMore: (data?.length || 0) === pageSize };
}

export async function getCreatorProfileBySlugServer(slug) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('creator_profiles').select('*').eq('slug', slug).maybeSingle();
  if (!data) return null;
  return serializeDoc(rowToApp(data));
}

export async function getCreatorPostServer(postId) {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.from('creator_posts').select('*').eq('id', postId).maybeSingle();
  if (!data || data.status !== 'published') return null;
  return serializeDoc(rowToApp(data));
}

export async function listPublishedPravasiPosts(limit = 12) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('creator_posts')
      .select('*')
      .eq('status', 'published')
      .or('visibility.eq.public,visibility.is.null')
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []).map(row => serializeDoc(rowToApp(row)));
  } catch {
    return [];
  }
}

export async function getPublishedPravasiPost(param) {
  const safe = decodeURIComponent(param || '').slice(0, 120);
  if (!/^[a-zA-Z0-9-]+$/.test(safe)) return null;
  try {
    const supabase = getSupabaseAdmin();
    const visible = (row) => row && row.status === 'published' && row.visibility !== 'private';

    const { data: bySlug } = await supabase
      .from('creator_posts')
      .select('*')
      .eq('slug', safe)
      .eq('status', 'published')
      .limit(2);
    const slugHits = (bySlug || []).filter(visible);
    if (slugHits.length === 1) return serializeDoc(rowToApp(slugHits[0]));

    const { data: byId } = await supabase.from('creator_posts').select('*').eq('id', safe).maybeSingle();
    if (visible(byId)) return serializeDoc(rowToApp(byId));

    const { data: recent } = await supabase
      .from('creator_posts')
      .select('*')
      .eq('status', 'published')
      .or('visibility.eq.public,visibility.is.null')
      .order('published_at', { ascending: false })
      .limit(200);
    const match = (recent || []).find(row => `${row.author_slug}-${row.slug}` === safe);
    return match ? serializeDoc(rowToApp(match)) : null;
  } catch {
    return null;
  }
}

export async function listFeaturedCreators(limit = 6) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('slug, display_name, photo_url, bio, follower_count')
      .order('follower_count', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data || []).map(row => serializeDoc(rowToApp(row)));
  } catch {
    return [];
  }
}
