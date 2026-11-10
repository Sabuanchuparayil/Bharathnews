import { getSupabaseAdmin } from './supabase-server';
import { blockedAccountError } from './account-status';

export async function verifyUserRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { error: 'Sign in required.', status: 401 };

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user?.id || !user.email) return { error: 'Invalid session.', status: 401 };

    const { data: profile } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .maybeSingle();
    const blocked = blockedAccountError(profile?.status);
    if (blocked) return blocked;

    return { uid: user.id, email: user.email.trim().toLowerCase() };
  } catch (err) {
    return { error: err?.message || 'Invalid session.', status: 401 };
  }
}
