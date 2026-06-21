import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdmin();
  const status = request.nextUrl.searchParams.get('status') || 'failed';
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10), 200);

  const query = supabase
    .from('distribution_jobs')
    .select('id, article_id, channel, status, attempts, max_attempts, last_error, next_retry_at, sent_at, created_at, updated_at, articles(slug, title, language)')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = { pending: 0, failed: 0, sent: 0, skipped: 0 };
  const { data: allStatuses } = await supabase.from('distribution_jobs').select('status');
  for (const row of allStatuses || []) {
    if (counts[row.status] !== undefined) counts[row.status]++;
  }

  return NextResponse.json({ jobs: data || [], counts });
}

export async function POST(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = body.jobId || body.id;
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  if (!workerUrl) {
    return NextResponse.json({ error: 'Worker URL not configured' }, { status: 500 });
  }

  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/api/retry-distribution-job?k=run7x9k&id=${encodeURIComponent(jobId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data.error || 'Retry failed' }, { status: res.status });
  }

  return NextResponse.json({ ok: true, ...data });
}
