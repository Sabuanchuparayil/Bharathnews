import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { mapRows } from '@/lib/admin-content';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '100', 10) || 100, 1), 500);
  const offset = Math.max(parseInt(request.nextUrl.searchParams.get('offset') || '0', 10) || 0, 0);
  const supabase = getSupabaseAdmin();
  if (request.nextUrl.searchParams.get('format') === 'csv') {
    return subscriberCsv(supabase);
  }
  const [list, count] = await Promise.all([
    supabase.from('subscribers').select('id, email, source, subscribed_at').order('subscribed_at', { ascending: false }).range(offset, offset + limit - 1),
    supabase.from('subscribers').select('id', { count: 'exact', head: true }),
  ]);
  if (list.error) return NextResponse.json({ error: list.error.message || 'Could not load subscribers.' }, { status: 500 });
  if (count.error) return NextResponse.json({ error: count.error.message || 'Could not count subscribers.' }, { status: 500 });

  const total = count.count || 0;
  return NextResponse.json({
    subscribers: mapRows(list.data),
    total,
    hasMore: offset + (list.data || []).length < total,
  });
}

function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

async function subscriberCsv(supabase) {
  const rows = [];
  let from = 0;
  while (rows.length < 5000) {
    const { data, error } = await supabase
      .from('subscribers')
      .select('email, source, subscribed_at')
      .order('subscribed_at', { ascending: false })
      .range(from, from + 499);
    if (error) return NextResponse.json({ error: error.message || 'Could not export subscribers.' }, { status: 500 });
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
    from += 500;
  }
  const lines = ['email,source,subscribed_at', ...rows.map(row => [row.email, row.source, row.subscribed_at].map(csvCell).join(','))];
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="subscribers.csv"',
    },
  });
}
