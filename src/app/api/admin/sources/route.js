import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { mapRows, sourceIdFromName, sourceRowFromBody } from '@/lib/admin-content';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('sources').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message || 'Could not load sources.' }, { status: 500 });
  return NextResponse.json({ sources: mapRows(data) });
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

  const parsed = sourceRowFromBody(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const id = sourceIdFromName(body.id || parsed.row.name);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('sources').insert({ id, ...parsed.row });
  if (error) {
    const status = /duplicate|unique/i.test(error.message || '') ? 409 : 500;
    return NextResponse.json({ error: error.message || 'Could not create the source.' }, { status });
  }
  return NextResponse.json({ id });
}
