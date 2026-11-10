import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeStats } from '@/lib/admin-content';

async function exactCount(supabase, table, apply) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) throw new Error(error.message || `Could not count ${table}.`);
  return count || 0;
}

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const supabase = getSupabaseAdmin();
    const [
      totalArticles,
      subscribers,
      users,
      sources,
      enabledSources,
      sourcesWithErrors,
      distributionPending,
      distributionFailed,
      facetsResult,
      recentResult,
    ] = await Promise.all([
      exactCount(supabase, 'articles', query => query.or('editorial_status.eq.published,editorial_status.is.null')),
      exactCount(supabase, 'subscribers'),
      exactCount(supabase, 'users'),
      exactCount(supabase, 'sources'),
      exactCount(supabase, 'sources', query => query.neq('enabled', false)),
      exactCount(supabase, 'sources', query => query.neq('enabled', false).not('last_error', 'is', null).neq('last_error', '')),
      exactCount(supabase, 'distribution_jobs', query => query.eq('status', 'pending')),
      exactCount(supabase, 'distribution_jobs', query => query.eq('status', 'failed')),
      supabase.rpc('admin_article_facets'),
      supabase.from('articles')
        .select('id, title, category, slug')
        .or('editorial_status.eq.published,editorial_status.is.null')
        .order('published_at', { ascending: false })
        .limit(5),
    ]);

    if (facetsResult.error) {
      return NextResponse.json({ error: facetsResult.error.message || 'Could not load stats.' }, { status: 500 });
    }
    if (recentResult.error) {
      return NextResponse.json({ error: recentResult.error.message || 'Could not load recent articles.' }, { status: 500 });
    }

    const stats = normalizeStats({
      ...facetsResult.data,
      totalArticles,
      subscribers,
      users,
      sources,
      enabledSources,
      sourcesWithErrors,
      distributionPending,
      distributionFailed,
      topArticles: recentResult.data,
    });

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Could not load stats.' }, { status: 500 });
  }
}
