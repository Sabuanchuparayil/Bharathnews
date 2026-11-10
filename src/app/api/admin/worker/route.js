import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { callWorker } from '@/lib/worker-client';

function clamp(value, fallback, max) {
  const number = parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, 0), max);
}

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const action = request.nextUrl.searchParams.get('action') || 'pipeline-status';
  if (action !== 'pipeline-status') {
    return NextResponse.json({ error: 'Unknown worker action.' }, { status: 400 });
  }

  try {
    const pipeline = await callWorker('/api/pipeline-status');
    return NextResponse.json(pipeline);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not reach the worker.' }, { status: err.status || 502 });
  }
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

  try {
    if (body?.action === 'backfill') {
      const data = await callWorker('/api/backfill-distribution-jobs', {
        limit: clamp(body.limit, 40, 60),
      });
      return NextResponse.json(data);
    }
    if (body?.action === 'distribute') {
      const data = await callWorker('/api/distribute-now', {
        backfill: body.backfill === true || body.backfill === '1' ? '1' : '0',
        telegram: clamp(body.telegram, 3, 20),
        facebook: clamp(body.facebook, 2, 20),
      });
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Unknown worker action.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Worker request failed.' }, { status: err.status || 502 });
  }
}
