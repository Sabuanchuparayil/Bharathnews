import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { mapRows } from '@/lib/admin-content';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10) || 50, 1), 200);
  const supabase = getSupabaseAdmin();
  const [list, count] = await Promise.all([
    supabase.from('videos').select('id, video_id, title, thumbnail, channel, channel_id, category, language, published_at, fetched_at').order('fetched_at', { ascending: false }).limit(limit),
    supabase.from('videos').select('id', { count: 'exact', head: true }),
  ]);
  if (list.error) return NextResponse.json({ error: list.error.message || 'Could not load videos.' }, { status: 500 });
  if (count.error) return NextResponse.json({ error: count.error.message || 'Could not count videos.' }, { status: 500 });

  return NextResponse.json({ videos: mapRows(list.data), total: count.count || 0 });
}
