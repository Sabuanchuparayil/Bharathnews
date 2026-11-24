import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeStats } from '@/lib/admin-content';
import { SOURCE_CATEGORY_IDS } from '@/config/category-taxonomy';

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

async function countRows(supabase, table, apply, mode = 'exact') {
  let query = supabase.from(table).select('id', { count: mode, head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) {
    console.error(`Stats count failed for ${table}:`, error.message);
    return 0;
  }
  return count || 0;
}

const PUBLISHED = query => query.or('editorial_status.eq.published,editorial_status.is.null');

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const supabase = getSupabaseAdmin();
    const categoryIds = SOURCE_CATEGORY_IDS.filter(id => id !== 'all');
    const [
      totalArticles,
      subscribers,
      users,
      sources,
      enabledSources,
      sourcesWithErrors,
      distributionPending,
      distributionFailed,
      recentResult,
      viewedResult,
      referrerResult,
      ...categoryCounts
    ] = await Promise.all([
      countRows(supabase, 'articles', PUBLISHED, 'estimated'),
      countRows(supabase, 'subscribers'),
      countRows(supabase, 'users'),
      countRows(supabase, 'sources'),
      countRows(supabase, 'sources', query => query.neq('enabled', false)),
      countRows(supabase, 'sources', query => query.neq('enabled', false).not('last_error', 'is', null).neq('last_error', '')),
      countRows(supabase, 'distribution_jobs', query => query.eq('status', 'pending')),
      countRows(supabase, 'distribution_jobs', query => query.eq('status', 'failed')),
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
      ...categoryIds.map(id => countRows(supabase, 'articles', query => PUBLISHED(query).eq('category', id), 'estimated')),
      countRows(supabase, 'articles', query => PUBLISHED(query).eq('language', 'en'), 'estimated'),
      countRows(supabase, 'articles', query => PUBLISHED(query).eq('language', 'ml'), 'estimated'),
    ]);

    if (recentResult.error) console.error('Stats recent articles failed:', recentResult.error.message);
    const languageCounts = categoryCounts.slice(categoryIds.length);
    const byCategory = categoryIds
      .map((name, index) => ({ name, count: categoryCounts[index] || 0 }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
    const byLanguage = [
      { name: 'en', count: languageCounts[0] || 0 },
      { name: 'ml', count: languageCounts[1] || 0 },
    ].filter(item => item.count > 0);

    const stats = normalizeStats({
      byCategory,
      byLanguage,
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
