import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { callWorker } from '@/lib/worker-client';

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
  try {
    const countResults = await Promise.all(Object.keys(counts).map(async (jobStatus) => {
      const { count, error: countError } = await supabase
        .from('distribution_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', jobStatus);
      if (countError) throw new Error(countError.message);
      return [jobStatus, count || 0];
    }));
    for (const [jobStatus, count] of countResults) counts[jobStatus] = count;
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not count distribution jobs.' }, { status: 500 });
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

  try {
    const data = await callWorker('/api/retry-distribution-job', { id: jobId });
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Retry failed' }, { status: err.status || 502 });
  }
}
