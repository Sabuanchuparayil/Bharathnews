import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { mapRows, moderatePost, reviewApplication } from '@/lib/admin-content';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  const [applications, posts] = await Promise.all([
    supabase.from('role_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
    supabase.from('creator_posts').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
  ]);
  if (applications.error) {
    return NextResponse.json({ error: applications.error.message || 'Could not load applications.' }, { status: 500 });
  }
  if (posts.error) {
    return NextResponse.json({ error: posts.error.message || 'Could not load posts.' }, { status: 500 });
  }

  return NextResponse.json({
    applications: mapRows(applications.data),
    posts: mapRows(posts.data),
  });
}

export async function POST(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const kind = body?.kind;
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const approved = body?.approved === true;
  const feedback = typeof body?.feedback === 'string' ? body.feedback.trim().slice(0, 1000) : '';
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  if (kind !== 'application' && kind !== 'post') {
    return NextResponse.json({ error: 'kind must be application or post.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const result = kind === 'application'
      ? await reviewApplication(supabase, { id, approved, feedback })
      : await moderatePost(supabase, { id, approved, feedback });

    if (result.notify) {
      const notifyUrl = new URL('/api/articles/telegram-notify', request.url);
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: request.headers.get('authorization') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.notify),
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not save the review.' }, { status: err.status || 500 });
  }
}
