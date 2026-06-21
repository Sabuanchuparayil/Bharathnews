#!/usr/bin/env node
/**
 * Create a new user with admin role (Supabase).
 * Usage: node scripts/create-admin-user.mjs <email> <password> [displayName]
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq <= 0) continue;
      if (!process.env[t.slice(0, eq).trim()]) process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  }
}

loadEnv();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const email = process.argv[2];
const password = process.argv[3];
const displayName = process.argv[4] || email?.split('@')[0] || 'Admin';

if (!email || !email.includes('@') || !password || password.length < 8) {
  console.error('Usage: node scripts/create-admin-user.mjs <email> <password> [displayName]');
  console.error('  password must be at least 8 characters');
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function main() {
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    if (createData.msg?.includes('already') || createRes.status === 422) {
      console.error(`User ${email} already exists. Use 'npm run set-first-admin ${email}' to promote.`);
    } else {
      console.error('Failed to create user:', createData.msg || createData.message || JSON.stringify(createData));
    }
    process.exit(1);
  }

  const userId = createData.id;

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: userId,
      email,
      display_name: displayName,
      role: 'admin',
      language: 'all',
      bookmarks: [],
      likes: [],
      interests: { categories: {}, topics: [], sources: {}, readingTimes: {} },
    }),
  });

  if (!upsertRes.ok) {
    console.error('User created in Auth but profile upsert failed:', await upsertRes.text());
    process.exit(1);
  }

  console.log(`✓ Admin user created: ${email} (id: ${userId})`);
}

main().catch(err => { console.error(err); process.exit(1); });
