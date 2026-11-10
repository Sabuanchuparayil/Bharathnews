import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { mapRows } from '@/lib/admin-content';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '200', 10) || 200, 1), 500);
  const supabase = getSupabaseAdmin();
  const [list, count] = await Promise.all([
    supabase.from('subscribers').select('id, email, source, subscribed_at').order('subscribed_at', { ascending: false }).limit(limit),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }),
  ]);
  if (list.error) return NextResponse.json({ error: list.error.message || 'Could not load subscribers.' }, { status: 500 });
  if (count.error) return NextResponse.json({ error: count.error.message || 'Could not count subscribers.' }, { status: 500 });

  return NextResponse.json({
    subscribers: mapRows(list.data),
    total: count.count || 0,
  });
}
