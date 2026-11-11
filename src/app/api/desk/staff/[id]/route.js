import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import { updateStaffProfile, validateStaffInput } from '@/lib/staff-profiles';

function jsonError(err) {
  return NextResponse.json(
    { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Request failed.') },
    { status: err.status || 500 },
  );
}

export async function PATCH(request, { params }) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.caps?.includes('admin')) {
    return NextResponse.json({ error: 'Only admins can edit staff profiles.' }, { status: 403 });
  }

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = validateStaffInput(body || {});
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const profile = await updateStaffProfile(id, parsed.value);
    return NextResponse.json({ profile });
  } catch (err) {
    return jsonError(err);
  }
}
