import { NextResponse } from 'next/server';
import { verifyAdminRequest, ALLOWED_ROLES } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';

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
  if (typeof role !== 'string' || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: `role must be one of: ${ALLOWED_ROLES.join(', ')}.` }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
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

    // Removing admin from yourself or from the last active admin would lock everyone out.
    if (target.role === 'admin' && role !== 'admin') {
      if (userId === auth.uid) {
        return NextResponse.json({ error: "You can't remove your own admin role." }, { status: 400 });
      }
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
        return NextResponse.json({ error: "You can't remove the last active admin." }, { status: 400 });
      }
    }

    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) {
      return NextResponse.json({ error: error.message || 'Could not update role.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, role });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Failed to update role.' }, { status: 500 });
  }
}
