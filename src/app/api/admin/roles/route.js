import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  adminRoleIds,
  isRoleId,
  normalizeAccessRoles,
  readAccessRoles,
  roleHasCap,
} from '@/lib/access-roles';

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const roles = await readAccessRoles(getSupabaseAdmin());
    return NextResponse.json({ roles });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not load roles.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const roles = normalizeAccessRoles(body?.roles);
  if (!roles.some(role => role.caps.includes('admin'))) {
    return NextResponse.json({ error: 'At least one role must keep admin access.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  try {
    const previous = await readAccessRoles(supabase);
    const removed = previous.filter(role => !role.builtin && !roles.some(next => next.id === role.id));
    for (const role of removed) {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', role.id);
      if (error) throw new Error(error.message || 'Could not check who uses this role.');
      if (count) {
        return NextResponse.json({
          error: `Move the ${count} ${count === 1 ? 'person' : 'people'} on ${role.label} to another role before deleting it.`,
        }, { status: 400 });
      }
    }

    const { data: caller } = await supabase.from('users').select('role').eq('id', auth.uid).maybeSingle();
    if (!roleHasCap(roles, caller?.role, 'admin')) {
      return NextResponse.json({ error: "You can't remove admin access from your own role." }, { status: 400 });
    }

    const ids = adminRoleIds(roles);
    const { count, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .in('role', ids.length ? ids : ['admin'])
      .or('status.eq.active,status.is.null');
    if (countError) throw new Error(countError.message || 'Could not verify admins.');
    if (!count) {
      return NextResponse.json({ error: 'Keep admin access on a role that an active user still has.' }, { status: 400 });
    }

    for (const role of roles) {
      if (!isRoleId(role.id) || role.label.trim().length < 2) {
        return NextResponse.json({ error: 'Every role needs a name of at least 2 characters.' }, { status: 400 });
      }
    }

    const { error } = await supabase.from('site_settings').upsert({ key: 'access_roles', value: roles });
    if (error) throw new Error(error.message || 'Could not save roles.');
    return NextResponse.json({ roles: await readAccessRoles(supabase) });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Could not save roles.' }, { status: 500 });
  }
}
