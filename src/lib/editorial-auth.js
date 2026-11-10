import { getSupabaseAdmin } from './supabase-server';
import { blockedAccountError } from './account-status';
import { EDITORIAL_ROLES } from './roles';

export async function verifyEditorialRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { error: 'Missing authorization token.', status: 401 };

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { error: 'Invalid token.', status: 401 };

    const { data: profile } = await supabase
      .from('users')
      .select('role, display_name, status')
      .eq('id', user.id)
      .single();

    if (!profile || !EDITORIAL_ROLES.has(profile.role)) {
      return { error: 'Newsroom access required.', status: 403 };
    }

    const blocked = blockedAccountError(profile.status);
    if (blocked) return blocked;

    return {
      uid: user.id,
      email: user.email,
      role: profile.role,
      displayName: profile.display_name || user.email?.split('@')[0] || 'Editor',
    };
  } catch (err) {
    return { error: err?.message || 'Invalid token.', status: 401 };
  }
}
