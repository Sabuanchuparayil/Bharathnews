import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/session-auth';
import { sendEmailOtp } from '@/lib/email-otp';

export async function POST(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    await sendEmailOtp({ uid: auth.uid, email: auth.email });
    return NextResponse.json({ ok: true, email: auth.email });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not send a verification code.' }, { status: err.status || 500 });
  }
}
