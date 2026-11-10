import { NextResponse } from 'next/server';
import { getPrayerCity } from '@/config/prayer-cities';

export const revalidate = 3600;

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export async function GET(request) {
  const requested = new URL(request.url).searchParams.get('city') || 'dubai';
  const place = getPrayerCity(requested);
  if (!place) {
    return NextResponse.json({ error: 'Unknown city' }, { status: 400 });
  }

  const endpoint = new URL('https://api.aladhan.com/v1/timingsByCity');
  endpoint.searchParams.set('city', place.city);
  endpoint.searchParams.set('country', place.country);
  endpoint.searchParams.set('method', '4');

  try {
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Prayer times unavailable (${res.status})`);
    const body = await res.json();
    const raw = body?.data?.timings;
    if (!raw) throw new Error('Prayer times unavailable');

    const timings = {};
    for (const name of PRAYERS) {
      const value = String(raw[name] || '').slice(0, 5);
      if (/^\d{2}:\d{2}$/.test(value)) timings[name] = value;
    }

    return NextResponse.json(
      { city: requested, label: place.label, timings },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Prayer times unavailable' },
      { status: 503 },
    );
  }
}
