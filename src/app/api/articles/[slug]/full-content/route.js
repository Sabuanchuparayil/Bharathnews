import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { fetchArticleBodyFromUrl, isExcerptOnly, normalizeArticleBody } from '@/lib/article-content';

export const dynamic = 'force-dynamic';

/** Enrich short articles by fetching the full story from the original source. */
export async function GET(_request, { params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || '');

  if (!decoded) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, slug, full_content, source_url, summary')
    .eq('slug', decoded)
    .maybeSingle();

  if (error || !article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const existing = normalizeArticleBody(article.full_content || article.summary || '');
  if (!isExcerptOnly(existing, article.summary || '')) {
    return NextResponse.json({ content: existing, cached: true });
  }

  const sourceUrl = article.source_url || '';
  if (!sourceUrl) {
    return NextResponse.json({ content: existing, cached: true });
  }

  const fetched = await fetchArticleBodyFromUrl(sourceUrl);
  const content = fetched.length > existing.length ? fetched : existing;

  if (fetched.length > existing.length) {
    await supabase
      .from('articles')
      .update({ full_content: content, updated_at: new Date().toISOString() })
      .eq('id', article.id);
  }

  return NextResponse.json({ content, cached: false });
}
