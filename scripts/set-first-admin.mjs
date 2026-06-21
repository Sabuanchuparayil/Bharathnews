#!/usr/bin/env node
/**
 * Promote a user to admin by email (Supabase).
 * Usage: npm run set-first-admin user@example.com
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

if (!email || !email.includes('@')) {
  console.error('Usage: npm run set-first-admin <email>');
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
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id,email,role`,
    { headers: { ...headers, Prefer: 'return=representation' } }
  );
  const users = await res.json();

  if (!Array.isArray(users) || users.length === 0) {
    console.error(`No user found with email: ${email}`);
    console.error('The user must sign in at least once before being promoted.');
    process.exit(1);
  }

  const user = users[0];
  if (user.role === 'admin') {
    console.log(`${email} is already an admin.`);
    return;
  }

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ role: 'admin' }),
    }
  );

  if (!updateRes.ok) {
    console.error('Failed to update role:', await updateRes.text());
    process.exit(1);
  }

  console.log(`✓ ${email} promoted to admin.`);
}

main().catch(err => { console.error(err); process.exit(1); });
