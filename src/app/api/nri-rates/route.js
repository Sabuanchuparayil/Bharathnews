import { NextResponse } from 'next/server';
import { fetchNriRates } from '@/lib/nri-rates';

export const revalidate = 900;

export async function GET() {
  try {
    const data = await fetchNriRates();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Rates unavailable' },
      { status: 503, headers: { 'Cache-Control': 'public, s-maxage=60' } },
    );
  }
}
