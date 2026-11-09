import { NextResponse } from 'next/server';

export const revalidate = 3600;

const CITIES = {
  dubai: { city: 'Dubai', country: 'United Arab Emirates', label: 'Dubai' },
  abudhabi: { city: 'Abu Dhabi', country: 'United Arab Emirates', label: 'Abu Dhabi' },
  sharjah: { city: 'Sharjah', country: 'United Arab Emirates', label: 'Sharjah' },
  riyadh: { city: 'Riyadh', country: 'Saudi Arabia', label: 'Riyadh' },
  jeddah: { city: 'Jeddah', country: 'Saudi Arabia', label: 'Jeddah' },
  doha: { city: 'Doha', country: 'Qatar', label: 'Doha' },
  kuwait: { city: 'Kuwait City', country: 'Kuwait', label: 'Kuwait' },
  manama: { city: 'Manama', country: 'Bahrain', label: 'Manama' },
  muscat: { city: 'Muscat', country: 'Oman', label: 'Muscat' },
};

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export async function GET(request) {
  const requested = new URL(request.url).searchParams.get('city') || 'dubai';
  const place = CITIES[requested];
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
