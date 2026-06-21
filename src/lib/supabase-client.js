'use client';

import { createBrowserClient } from '@supabase/ssr';

let browserClient = null;

export function getSupabaseBrowser() {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}

export async function getSupabaseAsync() {
  return getSupabaseBrowser();
}

/** @deprecated use getSupabaseBrowser */
export const getDbAsync = getSupabaseAsync;
export const getDb = getSupabaseBrowser;
