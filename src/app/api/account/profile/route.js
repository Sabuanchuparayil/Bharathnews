import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/session-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { validateProfileDetails } from '@/lib/profile-fields';

export async function POST(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = validateProfileDetails(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const details = parsed.value;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('users').update({
    country: details.country,
    city: details.city,
    nationality: details.nationality,
    phone: details.phone || '',
    whatsapp: details.whatsapp || '',
    date_of_birth: details.dateOfBirth || null,
    profession: details.profession,
    profile_complete: true,
  }).eq('id', auth.uid);

  if (error) {
    return NextResponse.json({ error: 'Could not save your details.' }, { status: 500 });
  }

  return NextResponse.json({ profileComplete: true });
}
