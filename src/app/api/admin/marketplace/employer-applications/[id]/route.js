import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { employerSlugFromCompany } from '@/lib/marketplace-slug';

export async function PATCH(request, { params }) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Application ID required.' }, { status: 400 });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { action, feedback } = body;
  if (!['approve', 'reject', 'resubmit'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve, reject, or resubmit.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: app, error: fetchErr } = await supabase
    .from('employer_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !app) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  const statusMap = { approve: 'approved', reject: 'rejected', resubmit: 'resubmit' };

  const { error: updateErr } = await supabase
    .from('employer_applications')
    .update({
      status: statusMap[action],
      admin_feedback: feedback || '',
      reviewed_by: auth.uid,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (action === 'approve') {
    await supabase
      .from('users')
      .update({ role: 'employer' })
      .eq('id', app.user_id);

    const slug = employerSlugFromCompany(app.company_name, app.user_id);

    await supabase.from('employer_profiles').upsert({
      user_id: app.user_id,
      slug,
      company_name: app.company_name,
      trade_license_no: app.trade_license_no,
      country: app.country,
      city: app.city,
      contact_name: app.contact_name,
      contact_email: app.contact_email,
      contact_phone: app.contact_phone,
      whatsapp: app.whatsapp,
      company_website: app.company_website,
      company_description: app.company_description,
      verified: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }

  return NextResponse.json({ success: true, status: statusMap[action] });
}
