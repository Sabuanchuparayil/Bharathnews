import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/session-auth';
import { verifyEmailOtp } from '@/lib/email-otp';

export async function POST(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  try {
    await verifyEmailOtp({ uid: auth.uid, email: auth.email, code: body.code });
    return NextResponse.json({ verified: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not verify that code.' }, { status: err.status || 500 });
  }
}
