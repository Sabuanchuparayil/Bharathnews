import { NextResponse } from 'next/server';
import {
  normalizeResetEmail, resolveResetOrigin, sendRecoveryEmail,
} from '@/lib/password-reset-server';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const email = normalizeResetEmail(body?.email);
  if (!email) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    await sendRecoveryEmail(email, resolveResetOrigin(request));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Could not send the reset email.' },
      { status: err.status || 500 },
    );
  }
}
