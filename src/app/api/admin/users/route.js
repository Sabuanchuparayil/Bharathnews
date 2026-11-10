import { NextResponse } from 'next/server';
import { verifyAdminRequest, createUserWithRole } from '@/lib/supabase-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { rowToApp } from '@/lib/db-mapper';
import { isAccountStatus } from '@/lib/account-status';

const MAX_PAGE_SIZE = 100;
// Only the columns the admin UI needs - phone, date of birth etc. stay private.
const LIST_COLUMNS = 'id, email, display_name, photo_url, role, status, status_reason, status_changed_at, created_at, email_verified';

/** Strip characters that have meaning inside a PostgREST `or()` filter / ilike pattern. */
function sanitizeSearch(raw) {
  return String(raw || '').replace(/[%,()*\\_]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

export async function GET(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = request.nextUrl.searchParams;
  const pageSize = Math.min(Math.max(parseInt(params.get('pageSize') || '25', 10) || 25, 1), MAX_PAGE_SIZE);
  const offset = Math.max(parseInt(params.get('offset') || '0', 10) || 0, 0);
  const search = sanitizeSearch(params.get('search'));
  const statusParam = params.get('status') || 'all';
  if (statusParam !== 'all' && !isAccountStatus(statusParam)) {
    return NextResponse.json({ error: 'Invalid status filter.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('users')
      .select(LIST_COLUMNS, { count: 'exact' })
      .order('email', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (statusParam !== 'all') query = query.eq('status', statusParam);
    if (search) query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message || 'Could not load users.' }, { status: 500 });
    }

    const total = count ?? (data || []).length;
    return NextResponse.json({
      users: (data || []).map(rowToApp),
      total,
      hasMore: offset + (data || []).length < total,
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Could not load users.' }, { status: 500 });
  }
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

  const { email, password, displayName, role = 'reader' } = body || {};

  try {
    const user = await createUserWithRole({ email, password, displayName, role });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const status = err.status || 400;
    return NextResponse.json({ error: err.message || 'Failed to create user.' }, { status });
  }
}
