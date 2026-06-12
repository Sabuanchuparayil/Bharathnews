import { NextResponse } from 'next/server';
import { verifyAdminRequest, createUserWithRole } from '@/lib/firebase-admin-server';

export async function POST(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { email, password, displayName, role = 'reader' } = body || {};

  try {
    const user = await createUserWithRole({ email, password, displayName, role });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const status = err.status || 400;
    return NextResponse.json({ error: err.message || 'Failed to create user.' }, { status });
  }
}
