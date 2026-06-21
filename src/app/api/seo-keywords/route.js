import { getSupabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'seo-keywords')
      .single();

    if (error || !data) {
      return NextResponse.json({ keywords: [], trending: [], updated_at: null }, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
      });
    }

    return NextResponse.json(data.value, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
