'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';

export async function deskAuthHeaders() {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Sign in required.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sign in required.');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export async function deskFetch(path, options = {}) {
  const headers = await deskAuthHeaders();
  const res = await fetch(path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
