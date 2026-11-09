import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { rowToApp } from '@/lib/db-mapper';
import { onArticlePublished } from '@/lib/on-article-published';
import { postToTelegram } from '@/lib/telegram';
import { SITE_URL } from '@/lib/site-url';
import { pravasiPublicPath } from '@/lib/pravasi';

export async function POST(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const articleId = typeof body.articleId === 'string' ? body.articleId.trim() : '';
  const creatorPostId = typeof body.creatorPostId === 'string' ? body.creatorPostId.trim() : '';
  if (!articleId && !creatorPostId) {
    return NextResponse.json({ error: 'articleId required.' }, { status: 400 });
  }

  if (creatorPostId) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from('creator_posts').select('*').eq('id', creatorPostId).single();
      if (error || !data || data.status !== 'published') {
        return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
      }
      const post = rowToApp(data);
      await postToTelegram({
        title: post.title,
        url: `${SITE_URL}${pravasiPublicPath(post)}`,
        excerpt: post.excerpt || '',
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ error: err.message || 'Notify failed.' }, { status: 500 });
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('articles').select('*').eq('id', articleId).single();
    if (error || !data) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    const article = rowToApp(data);
    await onArticlePublished(article);

    return NextResponse.json({ ok: true, telegramPostedAt: article.telegramPostedAt || 'attempted' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Notify failed.' }, { status: 500 });
  }
}
