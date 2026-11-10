import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/supabase-admin';
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

  const { userId, newPassword } = body || {};

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json(
      { error: 'newPassword must be at least 8 characters.' },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to reset password.' },
        { status: 400 },
      );
    }

    // Skipped for the admin's own account so the request doesn't sign them out mid-session.
    if (userId !== auth.uid) {
      const { error: revokeError } = await supabase.rpc('revoke_user_sessions', { target: userId });
      if (revokeError) {
        return NextResponse.json(
          { error: `Password changed, but existing sessions could not be signed out: ${revokeError.message}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      email: data.user?.email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Failed to reset password.' },
      { status: 500 },
    );
  }
}
