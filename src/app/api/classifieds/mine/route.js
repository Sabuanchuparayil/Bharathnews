import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/marketplace-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('classifieds')
    .select('*')
    .eq('user_id', auth.uid)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ classifieds: data || [] });
}
