import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sourceRowFromBody } from '@/lib/admin-content';

export async function PATCH(request, { params }) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Source id is required.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = sourceRowFromBody(body, { partial: true });
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('sources')
    .update({ ...parsed.row, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message || 'Could not update the source.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Source not found.' }, { status: 404 });
  return NextResponse.json({ id: data.id });
}

export async function DELETE(request, { params }) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Source id is required.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('sources').delete().eq('id', id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message || 'Could not delete the source.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Source not found.' }, { status: 404 });
  return NextResponse.json({ id: data.id });
}
