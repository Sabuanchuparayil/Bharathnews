import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeStats } from '@/lib/admin-content';

function referrerTotals(rows) {
  const totals = new Map();
  for (const row of rows || []) {
    const host = String(row.host || 'direct');
    totals.set(host, (totals.get(host) || 0) + (Number(row.hits) || 0));
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));
}

async function exactCount(supabase, table, apply) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) {
    console.error(`Stats count failed for ${table}:`, error.message);
    return 0;
  }
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
      viewedResult,
      referrerResult,
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
      supabase.from('articles')
        .select('id, title, slug, views')
        .or('editorial_status.eq.published,editorial_status.is.null')
        .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('views', { ascending: false })
        .limit(5),
      supabase.from('article_referrers')
        .select('host, hits')
        .gte('day', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .limit(500),
    ]);

    if (facetsResult.error) console.error('Stats facets failed:', facetsResult.error.message);
    if (recentResult.error) console.error('Stats recent articles failed:', recentResult.error.message);

    const stats = normalizeStats({
      ...(facetsResult.error || !facetsResult.data ? {} : facetsResult.data),
      totalArticles,
      subscribers,
      users,
      sources,
      enabledSources,
      sourcesWithErrors,
      distributionPending,
      distributionFailed,
      topArticles: recentResult.error ? [] : recentResult.data,
      mostViewed: viewedResult.error ? [] : viewedResult.data,
      topReferrers: referrerTotals(referrerResult.error ? [] : referrerResult.data),
    });

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Could not load stats.' }, { status: 500 });
  }
}
