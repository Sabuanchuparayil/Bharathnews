import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: 'Slug required.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('job_postings')
    .select('id, slug, title, description, requirements, company_name, company_logo_url, job_type, industry, gender_preference, country, city, remote_ok, salary_min, salary_max, salary_currency, benefits, apply_url, apply_email, whatsapp_number, status, published_at, expires_at, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  if (data.status !== 'approved') {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Job expired.' }, { status: 410 });
  }

  return NextResponse.json({ job: data });
}
