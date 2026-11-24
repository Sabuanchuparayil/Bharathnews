import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL || '').replace(/\/$/, '');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function storeMessage(body) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('contact_messages').insert({
      name: body.name.slice(0, 80),
      email: body.email.slice(0, 160),
      topic: String(body.topic || 'general').slice(0, 40),
      subject: body.subject.slice(0, 160),
      message: body.message.slice(0, 4000),
      status: 'open',
    });
    if (error) {
      console.error('Contact inbox failed:', error.message);
      return { stored: false, error: error.message };
    }
    return { stored: true };
  } catch (err) {
    console.error('Contact inbox failed:', err.message);
    return { stored: false, error: err.message };
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim();
  const subject = String(body?.subject || '').trim();
  const message = String(body?.message || '').trim();
  if (!name || !isValidEmail(email) || !subject || message.length < 10) {
    return NextResponse.json(
      { error: 'Please fill in all fields with a valid email and a message of at least 10 characters.' },
      { status: 400 },
    );
  }
  const inbox = await storeMessage({ ...body, name, email, subject, message });

  if (!WORKER_URL) {
    if (inbox.stored) {
      return NextResponse.json({
        ok: true,
        inboxStored: true,
        message: 'Received. The newsroom inbox has your message.',
      });
    }
    return NextResponse.json(
      { error: 'Contact service unavailable. Email bharathnewsweb@gmail.com directly.', inboxStored: false },
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
      return NextResponse.json(
        { error: data.error || 'Failed to send message.', inboxStored: inbox.stored },
        { status: res.status },
      );
    }
    if (!inbox.stored) {
      return NextResponse.json({
        error: 'Your email was sent, but the newsroom inbox did not record it. Apply supabase/migrations/20261124140000_newsroom_controls.sql.',
        emailSent: true,
        inboxStored: false,
      }, { status: 502 });
    }
    return NextResponse.json({ ...data, inboxStored: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to send message.' }, { status: 500 });
  }
}
