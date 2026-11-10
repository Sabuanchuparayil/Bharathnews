import { NextResponse } from 'next/server';
import { verifyAdminRequest, createUserWithRole } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  listStaffProfiles,
  createStaffProfile,
  linkStaffToUser,
  validateStaffInput,
} from '@/lib/staff-profiles';

function jsonError(err) {
  return NextResponse.json(
    { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Request failed.') },
    { status: err.status || 500 },
  );
}

/** GET — list staff with account info (admin only). */
export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('all') !== '1';
  try {
    const staff = await listStaffProfiles({ activeOnly, withAccounts: true });
    return NextResponse.json({ staff });
  } catch (err) {
    return jsonError(err);
  }
}

/**
 * POST — create an editorial team member.
 *
 * Two modes:
 *  1. `{ action: "invite", ... }` — creates a user account + staff profile in one step.
 *  2. `{ action: "link", staffId, userId }` — links an existing staff profile to a user.
 *  3. Default (no action) — creates a staff profile without a user account (backwards-compat).
 */
export async function POST(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const action = body.action || 'create';

  // ── Link existing profile to existing user ──
  if (action === 'link') {
    const { staffId, userId } = body;
    if (!staffId) return NextResponse.json({ error: 'staffId is required.' }, { status: 400 });
    try {
      const profile = await linkStaffToUser(staffId, userId || null);
      return NextResponse.json({ profile });
    } catch (err) {
      return jsonError(err);
    }
  }

  // ── Invite: create user account + staff profile ──
  if (action === 'invite') {
    const { email, password, role = 'content_writer' } = body;
    if (!email?.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (role !== 'content_writer' && role !== 'admin') {
      return NextResponse.json({ error: 'Editorial role must be content_writer or admin.' }, { status: 400 });
    }

    const parsed = validateStaffInput({
      ...body,
      email,
      displayName: body.displayName || email.split('@')[0],
    });
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    let user;
    try {
      user = await createUserWithRole({
        email,
        password,
        displayName: parsed.value.displayName,
        role,
      });

      const profile = await createStaffProfile(parsed.value, { userId: user.uid });

      return NextResponse.json({
        profile,
        credentials: { email: user.email, password, displayName: user.displayName, role },
      }, { status: 201 });
    } catch (err) {
      if (user?.uid) {
        const supabase = getSupabaseAdmin();
        await supabase.from('users').delete().eq('id', user.uid);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.uid);
        if (deleteError) {
          err.message = `${err.message || 'Could not create the staff profile.'} The new account could not be removed: ${deleteError.message}`;
        }
      }
      return jsonError(err);
    }
  }

  // ── Default: create staff profile only ──
  const parsed = validateStaffInput(body || {});
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const profile = await createStaffProfile(parsed.value);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
