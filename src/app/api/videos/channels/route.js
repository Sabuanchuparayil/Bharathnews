import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeVideoChannel } from '@/lib/video-channels';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('sources')
      .select('name, url, category, language, enabled, type')
      .eq('type', 'youtube')
      .neq('enabled', false);
    if (error || !data?.length) {
      return NextResponse.json({ channels: [] }, { headers: { 'Cache-Control': 'public, max-age=60' } });
    }
    const channels = data.map(normalizeVideoChannel).filter(Boolean);
    return NextResponse.json({ channels }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch {
    return NextResponse.json({ channels: [] });
  }
}
