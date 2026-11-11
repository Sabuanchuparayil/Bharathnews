import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { countOtherActiveAdmins, readAccessRoles, roleHasCap } from '@/lib/access-roles';

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
    if (typeof role !== 'string' || !roles.some(item => item.id === role)) {
      return NextResponse.json({ error: 'Choose one of the access roles.' }, { status: 400 });
    }
    const { data: target, error: targetError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .maybeSingle();
    if (targetError) {
      return NextResponse.json({ error: targetError.message || 'Could not load user.' }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (target.role === role) {
      return NextResponse.json({ success: true, role, unchanged: true });
    }

    const removingAdmin = roleHasCap(roles, target.role, 'admin') && !roleHasCap(roles, role, 'admin');
    if (removingAdmin) {
      if (userId === auth.uid) {
        return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
      }
      const others = await countOtherActiveAdmins(supabase, roles, userId);
      if (!others) {
        return NextResponse.json({ error: "You can't remove the last active admin." }, { status: 400 });
      }
    }

    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) {
      const message = /users_role_check|check constraint/i.test(error.message || '')
        ? 'Run supabase/migrations/20261111120000_custom_access_roles.sql in the Supabase SQL editor, then try again.'
        : (error.message || 'Could not update role.');
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ success: true, role });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to update role.' }, { status: 500 });
  }
}
