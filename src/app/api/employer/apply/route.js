import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/marketplace-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('employer_applications')
    .select('*')
    .eq('user_id', auth.uid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ application: data || null });
}

export async function POST(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (auth.role === 'employer') {
    return NextResponse.json({ error: 'Already an approved employer.' }, { status: 400 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { companyName, tradeLicenseNo, country, city, contactName, contactEmail, contactPhone, whatsapp, companyWebsite, companyDescription, documentUrls } = body;

  if (!companyName?.trim() || !contactName?.trim() || !contactEmail?.trim() || !country?.trim()) {
    return NextResponse.json({ error: 'Company name, contact name, contact email, and country are required.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
    return NextResponse.json({ error: 'Contact email is not valid.' }, { status: 400 });
  }
  if (companyWebsite?.trim()) {
    try { const u = new URL(companyWebsite.trim()); if (!['http:', 'https:'].includes(u.protocol)) throw 0; }
    catch { return NextResponse.json({ error: 'Company website must be a valid http/https URL.' }, { status: 400 }); }
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('employer_applications')
    .select('id, status')
    .eq('user_id', auth.uid)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status === 'approved') {
    return NextResponse.json({ error: 'Already an approved employer.' }, { status: 400 });
  }
  if (existing?.status === 'pending') {
    return NextResponse.json({ error: 'You already have a pending application.' }, { status: 409 });
  }

  const sanitizedDocUrls = {};
  const allowedDocPrefix = `employer-kyc/${auth.uid}/`;
  if (documentUrls && typeof documentUrls === 'object') {
    for (const [key, val] of Object.entries(documentUrls)) {
      if (typeof val === 'string' && val.startsWith(allowedDocPrefix)) {
        sanitizedDocUrls[key] = val;
      }
    }
  }

  const payload = {
    user_id: auth.uid,
    company_name: companyName.trim(),
    trade_license_no: tradeLicenseNo?.trim() || '',
    country: country.trim().toLowerCase(),
    city: city?.trim() || '',
    contact_name: contactName.trim(),
    contact_email: contactEmail.trim(),
    contact_phone: contactPhone?.trim() || '',
    whatsapp: whatsapp?.trim() || '',
    company_website: companyWebsite?.trim() || '',
    company_description: companyDescription?.trim() || '',
    document_urls: sanitizedDocUrls,
    status: 'pending',
    updated_at: new Date().toISOString(),
  };

  // On resubmit, update the existing record instead of creating a duplicate
  const { data: resubmitRow } = await supabase
    .from('employer_applications')
    .select('id')
    .eq('user_id', auth.uid)
    .in('status', ['resubmit', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let data, error;
  if (resubmitRow) {
    ({ data, error } = await supabase.from('employer_applications')
      .update(payload).eq('id', resubmitRow.id).select().single());
  } else {
    ({ data, error } = await supabase.from('employer_applications')
      .insert(payload).select().single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data }, { status: 201 });
}
