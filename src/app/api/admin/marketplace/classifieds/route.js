import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('classifieds')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ classifieds: data || [] });
}

export async function PATCH(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { id, action, feedback } = body;
  if (!id) return NextResponse.json({ error: 'Classified ID required.' }, { status: 400 });
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase.from('classifieds').select('status').eq('id', id).maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Classified not found.' }, { status: 404 });
  if (existing.status !== 'pending') {
    return NextResponse.json({ error: `Cannot ${action} a classified with status "${existing.status}".` }, { status: 400 });
  }

  const updates = {
    status: action === 'approve' ? 'approved' : 'rejected',
    admin_feedback: feedback || '',
    updated_at: new Date().toISOString(),
  };

  if (action === 'approve') {
    updates.published_at = new Date().toISOString();
    updates.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from('classifieds')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, classified: data });
}
