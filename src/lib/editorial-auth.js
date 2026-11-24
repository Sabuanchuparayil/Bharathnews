import { getSupabaseAdmin } from './supabase-server';
import { blockedAccountError } from './account-status';
import { capsForUser } from './access-roles';

const AUTH_TTL_MS = 20000;
const authCache = new Map();
const authPending = new Map();

function rememberAuth(token, value) {
  if (!value.error) {
    authCache.set(token, { value, expires: Date.now() + AUTH_TTL_MS });
    if (authCache.size > 100) authCache.delete(authCache.keys().next().value);
  }
  return value;
}

async function verifyToken(token) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { error: 'Invalid token.', status: 401 };

    const { data: profile } = await supabase
      .from('users')
      .select('role, display_name, status')
      .eq('id', user.id)
      .single();

    const { caps } = await capsForUser(supabase, profile, user.id);
    if (!profile || (!caps.includes('editorial') && !caps.includes('admin'))) {
      return { error: 'Newsroom access required.', status: 403 };
    }

    const blocked = blockedAccountError(profile.status);
    if (blocked) return blocked;

    return {
      uid: user.id,
      email: user.email,
      role: profile.role,
      caps,
      displayName: profile.display_name || user.email?.split('@')[0] || 'Editor',
    };
  } catch (err) {
    return { error: err?.message || 'Invalid token.', status: 401 };
  }
}

export async function verifyEditorialRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return { error: 'Missing authorization token.', status: 401 };

  const cached = authCache.get(token);
  if (cached && cached.expires > Date.now()) return cached.value;

  let flight = authPending.get(token);
  if (!flight) {
    flight = verifyToken(token).then(value => {
      authPending.delete(token);
      return rememberAuth(token, value);
    });
    authPending.set(token, flight);
  }
  return flight;
}
