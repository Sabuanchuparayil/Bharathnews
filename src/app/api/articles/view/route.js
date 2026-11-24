import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function referrerHost(value) {
  if (!value) return 'direct';
  try {
    const host = new URL(value).hostname.replace(/^www\./, '').toLowerCase();
    return host.slice(0, 120) || 'direct';
  } catch {
    return 'direct';
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const slug = String(body?.slug || '').trim();
  if (!/^[a-z0-9-]{3,80}$/i.test(slug)) {
    return NextResponse.json({ error: 'Invalid article.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, views')
      .eq('slug', slug)
      .or('editorial_status.eq.published,editorial_status.is.null')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message || 'Could not record the read.' }, { status: 500 });
    if (!article) return NextResponse.json({ ok: true, counted: false });

    await supabase.from('articles').update({ views: (article.views || 0) + 1 }).eq('id', article.id);

    const host = referrerHost(body.referrer);
    const day = new Date().toISOString().slice(0, 10);
    const { data: existing, error: readError } = await supabase
      .from('article_referrers')
      .select('id, hits')
      .eq('article_id', article.id)
      .eq('host', host)
      .eq('day', day)
      .maybeSingle();
    if (!readError) {
      if (existing) {
        await supabase.from('article_referrers').update({ hits: (existing.hits || 0) + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('article_referrers').insert({
          article_id: article.id,
          host,
          day,
          hits: 1,
        });
      }
    }

    return NextResponse.json({ ok: true, counted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not record the read.' }, { status: 500 });
  }
}
