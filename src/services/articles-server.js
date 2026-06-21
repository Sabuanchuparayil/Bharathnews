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
