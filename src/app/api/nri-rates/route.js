import { NextResponse } from 'next/server';
import { fetchNriRates } from '@/lib/nri-rates';

export async function GET(request) {
  const fresh = new URL(request.url).searchParams.get('fresh') === '1';
  try {
    const data = await fetchNriRates({ fresh });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': fresh
          ? 'private, no-store'
          : 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Rates unavailable' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
