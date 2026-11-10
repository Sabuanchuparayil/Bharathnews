import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { BAN_DURATION, isAccountStatus } from '@/lib/account-status';

const REASON_MAX = 300;

// Deletes every refresh session. The current access token can still be used until it expires;
// server routes reject it through users.status, and the client signs out on its next refresh.
async function revokeUserSessions(supabase, userId) {
  const { error } = await supabase.rpc('revoke_user_sessions', { target: userId });
  if (error) {
    return { ok: false, error: error.message || 'Could not sign the user out of existing sessions.' };
  }
  return { ok: true };
}

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

  const { userId, status, reason } = body || {};

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }
  if (!isAccountStatus(status)) {
    return NextResponse.json({ error: 'status must be active, suspended, or deactivated.' }, { status: 400 });
  }
  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    return NextResponse.json({ error: 'reason must be a string.' }, { status: 400 });
  }
  const cleanReason = (reason || '').trim().slice(0, REASON_MAX);

  if (userId === auth.uid && status !== 'active') {
    return NextResponse.json({ error: "You can't suspend or deactivate your own account." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: target, error: targetError } = await supabase
      .from('users')
      .select('id, email, role, status, status_reason')
      .eq('id', userId)
      .maybeSingle();
    if (targetError) {
      return NextResponse.json({ error: targetError.message || 'Could not load user.' }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const previousStatus = target.status || 'active';
    if (previousStatus === status && status === 'active') {
      // Heal a ban that was left behind if the table and auth layer ever drifted.
      const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' });
      if (unbanError) {
        return NextResponse.json({ error: unbanError.message || 'Could not update account access.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, status, email: target.email, unchanged: true });
    }

    // Never leave the site without an active admin.
    if (target.role === 'admin' && status !== 'active') {
      const { count, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('status', 'active')
        .neq('id', userId);
      if (countError) {
        return NextResponse.json({ error: countError.message || 'Could not verify admins.' }, { status: 500 });
      }
      if (!count) {
        return NextResponse.json({ error: "You can't disable the last active admin." }, { status: 400 });
      }
    }

    // 1) Block (or unblock) sign-in at the auth layer first - this is the security-critical step.
    const banDuration = status === 'active' ? 'none' : BAN_DURATION;
    const { error: banError } = await supabase.auth.admin.updateUserById(userId, { ban_duration: banDuration });
    if (banError) {
      return NextResponse.json({ error: banError.message || 'Could not update account access.' }, { status: 400 });
    }

    // Drop existing sessions so an open tab cannot keep refreshing. Re-run this even when the
    // status is already suspended, so a retry still closes a session that survived the first attempt.
    if (status !== 'active') {
      const revoked = await revokeUserSessions(supabase, userId);
      if (!revoked.ok) {
        await supabase.auth.admin.updateUserById(userId, {
          ban_duration: previousStatus === 'active' ? 'none' : BAN_DURATION,
        });
        return NextResponse.json({ error: revoked.error || 'Could not sign the user out.' }, { status: 500 });
      }
    }

    if (previousStatus === status) {
      const previousReason = target.status_reason || '';
      if (!cleanReason || cleanReason === previousReason) {
        return NextResponse.json({ success: true, status, email: target.email, unchanged: true });
      }
      const { error: reasonError } = await supabase
        .from('users')
        .update({
          status_reason: cleanReason,
          status_changed_at: new Date().toISOString(),
          status_changed_by: auth.uid,
        })
        .eq('id', userId);
      if (reasonError) {
        return NextResponse.json({ error: reasonError.message || 'Could not save status.' }, { status: 500 });
      }
      return NextResponse.json({ success: true, status, email: target.email });
    }

    // 2) Record the status for the admin UI and server-side checks.
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status,
        status_reason: status === 'active' ? null : (cleanReason || null),
        status_changed_at: new Date().toISOString(),
        status_changed_by: auth.uid,
      })
      .eq('id', userId);

    if (updateError) {
      // Keep auth and table consistent: restore the previous ban state.
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: previousStatus === 'active' ? 'none' : BAN_DURATION,
      });
      return NextResponse.json({ error: updateError.message || 'Could not save status.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status, email: target.email });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to update status.' }, { status: 500 });
  }
}
