import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { mergeSiteSettings } from '@/lib/site-settings';

async function readSettings(supabase) {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle();
  if (error) throw new Error(error.message || 'Could not load settings.');
  return mergeSiteSettings(data?.value || {});
}

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const settings = await readSettings(getSupabaseAdmin());
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not load settings.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Settings must be an object.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const current = await readSettings(supabase);
    const settings = mergeSiteSettings({ ...current, ...body });
    const { error } = await supabase.from('site_settings').upsert({ key: 'site', value: settings });
    if (error) return NextResponse.json({ error: error.message || 'Could not save settings.' }, { status: 500 });
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not save settings.' }, { status: 500 });
  }
}
