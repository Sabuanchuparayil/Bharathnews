import { getSupabaseAdmin } from './supabase-server';

export async function verifyUserRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: 'Missing authorization token.', status: 401 };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { error: 'Invalid token.', status: 401 };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, display_name, email')
      .eq('id', user.id)
      .single();

    return {
      uid: user.id,
      email: user.email,
      role: profile?.role || 'reader',
      displayName: profile?.display_name || user.email?.split('@')[0] || 'User',
    };
  } catch (err) {
    return { error: err?.message || 'Invalid token.', status: 401 };
  }
}

export async function verifyEmployerRequest(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return auth;

  if (auth.role !== 'employer' && auth.role !== 'admin') {
    return { error: 'Employer access required. Complete KYC verification first.', status: 403 };
  }

  const supabase = getSupabaseAdmin();
  const { data: app } = await supabase
    .from('employer_applications')
    .select('status')
    .eq('user_id', auth.uid)
    .eq('status', 'approved')
    .maybeSingle();

  if (auth.role !== 'admin' && !app) {
    return { error: 'Approved employer KYC required.', status: 403 };
  }

  return auth;
}
