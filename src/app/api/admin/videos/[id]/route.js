import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function PATCH(request, { params }) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Video id is required.' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const row = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.length > 300) {
      return NextResponse.json({ error: 'Invalid title.' }, { status: 400 });
    }
    row.title = body.title.trim();
  }
  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || body.category.length > 40) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }
    row.category = body.category.trim();
  }
  if (!Object.keys(row).length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('videos').update(row).eq('id', id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message || 'Could not update the video.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Video not found.' }, { status: 404 });
  return NextResponse.json({ id: data.id });
}

export async function DELETE(request, { params }) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Video id is required.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('videos').delete().eq('id', id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message || 'Could not delete the video.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Video not found.' }, { status: 404 });
  return NextResponse.json({ id: data.id });
}
