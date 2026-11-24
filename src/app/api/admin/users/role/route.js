import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { countOtherActiveAdmins, readAccessRoles, resolveRoleAssignment, roleHasCap } from '@/lib/access-roles';
import { recordAudit } from '@/lib/audit-log';
import { restoreEditorialSeat, syncUserEditorialSeat } from '@/lib/staff-profiles';

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

  const { userId, role } = body || {};
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  try {
    const roles = await readAccessRoles(supabase);
    const assignment = resolveRoleAssignment(role, roles);
    if (assignment.error) {
      return NextResponse.json({ error: assignment.error }, { status: 400 });
    }
    const { data: target, error: targetError } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .eq('id', userId)
      .maybeSingle();
    if (targetError) {
      return NextResponse.json({ error: targetError.message || 'Could not load user.' }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const removingAdmin = roleHasCap(roles, target.role, 'admin') && !roleHasCap(roles, assignment.accountRole, 'admin');
    if (removingAdmin) {
      if (userId === auth.uid) {
        return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
      }
      const others = await countOtherActiveAdmins(supabase, roles, userId);
      if (!others) {
        return NextResponse.json({ error: "You can't remove the last active admin." }, { status: 400 });
      }
    }

    const { data: previousSeat, error: seatReadError } = await supabase
      .from('staff_profiles')
      .select('id, title, is_active, email, display_name')
      .eq('user_id', userId)
      .maybeSingle();
    if (seatReadError) {
      return NextResponse.json({ error: seatReadError.message || 'Could not load the editorial board seat.' }, { status: 500 });
    }

    let editorialTitle = previousSeat?.is_active ? (previousSeat.title || '') : '';
    if (assignment.board !== 'keep') {
      const seat = await syncUserEditorialSeat(supabase, {
        userId,
        email: target.email,
        displayName: target.display_name,
        title: assignment.editorialTitle,
        board: assignment.board,
      });
      editorialTitle = seat.editorialTitle;
    }

    if (target.role !== assignment.accountRole) {
      const { error } = await supabase.from('users').update({ role: assignment.accountRole }).eq('id', userId);
      if (error) {
        const message = /users_role_check|check constraint/i.test(error.message || '')
          ? 'Run supabase/migrations/20261111120000_custom_access_roles.sql in the Supabase SQL editor, then try again.'
          : (error.message || 'Could not update role.');
        if (assignment.board !== 'keep') {
          try {
            await restoreEditorialSeat(supabase, userId, previousSeat);
          } catch (restoreError) {
            return NextResponse.json({
              error: `${message} The board seat could not be restored: ${restoreError.message}`,
            }, { status: 500 });
          }
        }
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
    await recordAudit({
      actorId: auth.uid,
      action: 'role',
      entityType: 'user',
      entityId: userId,
      summary: `${assignment.accountRole}${editorialTitle ? ` · ${editorialTitle}` : ''}`,
    }, supabase);
    return NextResponse.json({ success: true, role: assignment.accountRole, editorialTitle });
  } catch (err) {
    const message = err?.hint ? `${err.message} ${err.hint}` : (err?.message || 'Failed to update role.');
    return NextResponse.json({ error: message }, { status: err?.status || 500 });
  }
}
