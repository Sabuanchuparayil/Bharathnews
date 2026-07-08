import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: 'Slug required.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('classifieds')
    .select('id, slug, title, description, images, price, price_currency, price_type, listing_type, category, country, city, contact_method, contact_value, gender_target, status, published_at, expires_at, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });

  if (data.status !== 'approved') {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Listing expired.' }, { status: 410 });
  }

  return NextResponse.json({ classified: data });
}
