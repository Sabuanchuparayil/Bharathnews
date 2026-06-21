import { NextResponse } from 'next/server';
import { fetchSportsLive } from '@/lib/sports-live';

export const revalidate = 60;

export async function GET() {
  try {
    const data = await fetchSportsLive();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Sports data unavailable' },
      { status: 503, headers: { 'Cache-Control': 'public, s-maxage=30' } },
    );
  }
}
