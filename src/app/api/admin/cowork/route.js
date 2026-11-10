import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getCoworkIngestActivity } from '@/lib/editorial-articles';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const activity = await getCoworkIngestActivity();
    return NextResponse.json(activity);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Could not load cowork activity.' },
      { status: 500 },
    );
  }
}
