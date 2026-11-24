import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, name, email, topic, subject, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    if (/contact_messages|schema cache|does not exist/i.test(error.message || '')) {
      return NextResponse.json({ messages: [], hint: 'Run supabase/migrations/20261124140000_newsroom_controls.sql.' });
    }
    return NextResponse.json({ error: error.message || 'Could not load messages.' }, { status: 500 });
  }
  return NextResponse.json({ messages: data || [] });
}

export async function PATCH(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const status = body.status === 'closed' ? 'closed' : 'open';
  if (!body.id) return NextResponse.json({ error: 'Message id is required.' }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message || 'Could not update the message.' }, { status: 500 });
  return NextResponse.json({ id: body.id, status });
}
