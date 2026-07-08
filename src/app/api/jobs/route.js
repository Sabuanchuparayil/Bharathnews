import { NextResponse } from 'next/server';
import { verifyEmployerRequest } from '@/lib/marketplace-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { uniqueMarketplaceSlug } from '@/lib/marketplace-slug';
import { MARKETPLACE_LIMITS } from '@/lib/marketplace-constants';

function isSafeUrl(str) {
  if (!str) return true;
  try { const u = new URL(str); return ['http:', 'https:'].includes(u.protocol); } catch { return false; }
}
function isValidEmail(str) {
  return !str || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

export async function GET(request) {
  const url = new URL(request.url);
  const country = url.searchParams.get('country');
  const jobType = url.searchParams.get('job_type');
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);
  const offset = parseInt(url.searchParams.get('offset')) || 0;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('job_postings')
    .select('id, slug, title, description, requirements, company_name, company_logo_url, job_type, industry, gender_preference, country, city, remote_ok, salary_min, salary_max, salary_currency, benefits, apply_url, apply_email, whatsapp_number, published_at, expires_at')
    .eq('status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (country) query = query.eq('country', country.toLowerCase());
  if (jobType) query = query.eq('job_type', jobType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load jobs.' }, { status: 500 });

  return NextResponse.json({ jobs: data || [] });
}

export async function POST(request) {
  const auth = await verifyEmployerRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { title, description, requirements, companyName, companyLogoUrl, jobType, industry, genderPreference, country, city, remoteOk, salaryMin, salaryMax, salaryCurrency, benefits, applyUrl, applyEmail, whatsappNumber } = body;

  if (!title?.trim() || !description?.trim() || !country?.trim()) {
    return NextResponse.json({ error: 'Title, description, and country are required.' }, { status: 400 });
  }

  if (!applyUrl?.trim() && !applyEmail?.trim() && !whatsappNumber?.trim()) {
    return NextResponse.json({ error: 'At least one apply method is required (URL, email, or WhatsApp).' }, { status: 400 });
  }

  if (applyUrl?.trim() && !isSafeUrl(applyUrl.trim())) {
    return NextResponse.json({ error: 'Application URL must be a valid http/https URL.' }, { status: 400 });
  }
  if (applyEmail?.trim() && !isValidEmail(applyEmail.trim())) {
    return NextResponse.json({ error: 'Application email is not valid.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { count: activeCount } = await supabase
    .from('job_postings')
    .select('id', { count: 'exact', head: true })
    .eq('employer_id', auth.uid)
    .in('status', ['pending', 'approved']);

  if (activeCount >= MARKETPLACE_LIMITS.freeActiveJobs) {
    return NextResponse.json({ error: `You can have at most ${MARKETPLACE_LIMITS.freeActiveJobs} active/pending job posting(s).` }, { status: 429 });
  }

  const { data: profile } = await supabase
    .from('employer_profiles')
    .select('company_name, logo_url')
    .eq('user_id', auth.uid)
    .maybeSingle();

  const slug = uniqueMarketplaceSlug(title);

  const { data, error } = await supabase.from('job_postings').insert({
    employer_id: auth.uid,
    slug,
    title: title.trim(),
    description: description.trim(),
    requirements: requirements?.trim() || '',
    company_name: companyName?.trim() || profile?.company_name || '',
    company_logo_url: companyLogoUrl || profile?.logo_url || '',
    job_type: jobType || 'full-time',
    industry: industry?.trim() || '',
    gender_preference: genderPreference || 'any',
    country: country.trim().toLowerCase(),
    city: city?.trim() || '',
    remote_ok: remoteOk || false,
    salary_min: salaryMin != null && salaryMin !== '' ? Number(salaryMin) : null,
    salary_max: salaryMax != null && salaryMax !== '' ? Number(salaryMax) : null,
    salary_currency: salaryCurrency || 'AED',
    benefits: benefits?.trim() || '',
    apply_url: applyUrl?.trim() || '',
    apply_email: applyEmail?.trim() || '',
    whatsapp_number: whatsappNumber?.trim() || '',
    status: 'pending',
  }).select().single();

  if (error) {
    console.error('Job create error:', error.message);
    return NextResponse.json({ error: 'Failed to create job posting.' }, { status: 500 });
  }
  return NextResponse.json({ job: data }, { status: 201 });
}
