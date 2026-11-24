import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { publishDueDrafts } from '@/lib/editorial-articles';

function authorized(request) {
  const expected = process.env.WORKER_API_SECRET || '';
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!expected || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function POST(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const result = await publishDueDrafts();
    return NextResponse.json({
      published: result.published?.length || 0,
      skipped: result.skipped || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not publish scheduled drafts.' }, { status: 500 });
  }
}
