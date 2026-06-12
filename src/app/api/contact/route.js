import { NextResponse } from 'next/server';

const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL || '').replace(/\/$/, '');

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!WORKER_URL) {
    return NextResponse.json(
      { error: 'Contact service unavailable. Email bharathnewsweb@gmail.com directly.' },
      { status: 503 },
    );
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thebharathnews.com';
    const res = await fetch(`${WORKER_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: siteUrl,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Failed to send message.' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to send message.' }, { status: 500 });
  }
}
