import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import {
  createStaffProfile,
  listStaffProfiles,
  validateStaffInput,
} from '@/lib/staff-profiles';

function jsonError(err) {
  return NextResponse.json(
    { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Request failed.') },
    { status: err.status || 500 },
  );
}

export async function GET(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('all') !== '1';
  try {
    const staff = await listStaffProfiles({ activeOnly });
    return NextResponse.json({ staff, role: auth.role });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can add staff profiles.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = validateStaffInput(body || {});
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const profile = await createStaffProfile(parsed.value);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
