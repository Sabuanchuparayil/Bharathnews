import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/marketplace-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { uniqueMarketplaceSlug } from '@/lib/marketplace-slug';
import { MARKETPLACE_LIMITS } from '@/lib/marketplace-constants';

export async function GET(request) {
  const url = new URL(request.url);
  const country = url.searchParams.get('country');
  const category = url.searchParams.get('category');
  const listingType = url.searchParams.get('listing_type');
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);
  const offset = parseInt(url.searchParams.get('offset')) || 0;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('classifieds')
    .select('id, slug, title, description, images, price, price_currency, price_type, listing_type, category, country, city, contact_method, contact_value, gender_target, published_at, expires_at')
    .eq('status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (country) query = query.eq('country', country.toLowerCase());
  if (category) query = query.eq('category', category);
  if (listingType) query = query.eq('listing_type', listingType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to load classifieds.' }, { status: 500 });

  return NextResponse.json({ classifieds: data || [] });
}

export async function POST(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { title, description, images, price, priceCurrency, priceType, listingType, category, country, city, contactMethod, contactValue, genderTarget } = body;

  if (!title?.trim() || !description?.trim() || !country?.trim() || !contactValue?.trim()) {
    return NextResponse.json({ error: 'Title, description, country, and contact value are required.' }, { status: 400 });
  }

  const safeImages = (Array.isArray(images) ? images : [])
    .filter(u => typeof u === 'string' && u.startsWith('http'))
    .slice(0, MARKETPLACE_LIMITS.maxClassifiedImages);

  const supabase = getSupabaseAdmin();

  const { count: activeCount } = await supabase
    .from('classifieds')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.uid)
    .in('status', ['pending', 'approved']);

  if (activeCount >= MARKETPLACE_LIMITS.freeActiveClassifieds) {
    return NextResponse.json({ error: `You can have at most ${MARKETPLACE_LIMITS.freeActiveClassifieds} active/pending classified(s).` }, { status: 429 });
  }

  const slug = uniqueMarketplaceSlug(title);

  const { data, error } = await supabase.from('classifieds').insert({
    user_id: auth.uid,
    slug,
    title: title.trim(),
    description: description.trim(),
    images: safeImages,
    price: price != null && price !== '' ? Number(price) : null,
    price_currency: priceCurrency || 'AED',
    price_type: priceType || 'fixed',
    listing_type: listingType || 'sell',
    category: category || 'general',
    country: country.trim().toLowerCase(),
    city: city?.trim() || '',
    contact_method: contactMethod || 'whatsapp',
    contact_value: contactValue.trim(),
    gender_target: genderTarget || 'any',
    status: 'pending',
  }).select().single();

  if (error) {
    console.error('Classified create error:', error.message);
    return NextResponse.json({ error: 'Failed to create listing.' }, { status: 500 });
  }
  return NextResponse.json({ classified: data }, { status: 201 });
}
