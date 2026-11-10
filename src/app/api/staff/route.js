import { NextResponse } from 'next/server';
import { listStaffProfiles, toPublicStaffProfile } from '@/lib/staff-profiles';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const staff = await listStaffProfiles({ activeOnly: true });
    return NextResponse.json({ staff: staff.map(toPublicStaffProfile) });
  } catch (err) {
    return NextResponse.json(
      { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Could not load staff.') },
      { status: 500 },
    );
  }
}
