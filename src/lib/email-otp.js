import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from './supabase-server';
import { mergeSiteSettings } from './site-settings';

const OTP_TTL_MS = 10 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const HOUR_LIMIT = 3;

function hashCode(email, code) {
  return createHash('sha256').update(`${email}:${code}`).digest('hex');
}

function hashesMatch(stored, next) {
  const a = Buffer.from(stored);
  const b = Buffer.from(next);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function migrationHint(message) {
  if (/email_otps|email_verified|schema cache|does not exist/i.test(message || '')) {
    return 'Run supabase/migrations/20261109160000_email_otp_profiles.sql in the Supabase SQL editor.';
  }
  return '';
}

async function resolveFromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle();
    return mergeSiteSettings(data?.value || {}).integrations.email.newsletterFrom;
  } catch {
    return mergeSiteSettings().integrations.email.newsletterFrom;
  }
}

async function deliverOtpEmail({ to, code }) {
  const from = await resolveFromAddress();
  const subject = 'Your Bharath News verification code';
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;max-width:480px">
      <h2 style="color:#0D7377">Verify your email</h2>
      <p>Use this code to finish signing in to The Bharath News. It expires in 10 minutes.</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0">${code}</p>
      <p style="color:#666;font-size:13px">If you did not try to sign in, you can ignore this email.</p>
    </div>
  `;

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) throw new Error('Could not send the verification email.');
    return;
  }

  const worker = (process.env.NEXT_PUBLIC_WORKER_URL || '').replace(/\/$/, '');
  const secret = process.env.WORKER_API_SECRET;
  if (worker && secret) {
    const res = await fetch(`${worker}/api/otp-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ to, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not send the verification email.');
    return;
  }

  const err = new Error('Email verification is not configured. Add RESEND_API_KEY on the site, or point it at the Cloudflare worker.');
  err.status = 503;
  throw err;
}

export async function sendEmailOtp({ uid, email }) {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const hourAgo = new Date(now - HOUR_MS).toISOString();

  const { count, error: countError } = await supabase
    .from('email_otps')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', hourAgo);
  if (countError) {
    const err = new Error(migrationHint(countError.message) || 'Could not send a verification code.');
    err.status = 500;
    throw err;
  }
  if ((count || 0) >= HOUR_LIMIT) {
    const err = new Error('Too many codes were sent. Try again in an hour.');
    err.status = 429;
    throw err;
  }

  const { data: latest } = await supabase
    .from('email_otps')
    .select('created_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.created_at && now - new Date(latest.created_at).getTime() < COOLDOWN_MS) {
    const err = new Error('A code was just sent. Wait a minute before asking for another.');
    err.status = 429;
    throw err;
  }

  const code = String(randomInt(100000, 1000000));
  const { error: insertError } = await supabase.from('email_otps').insert({
    email,
    user_id: uid,
    code_hash: hashCode(email, code),
    expires_at: new Date(now + OTP_TTL_MS).toISOString(),
    used: false,
  });
  if (insertError) {
    const err = new Error(migrationHint(insertError.message) || 'Could not send a verification code.');
    err.status = 500;
    throw err;
  }

  try {
    await deliverOtpEmail({ to: email, code });
  } catch (err) {
    await supabase.from('email_otps').delete().eq('email', email).eq('code_hash', hashCode(email, code));
    if (!err.status) err.status = 502;
    throw err;
  }
}

export async function verifyEmailOtp({ uid, email, code }) {
  const normalized = String(code || '').replace(/\D/g, '');
  if (normalized.length !== 6) {
    const err = new Error('Enter the 6-digit code from your email.');
    err.status = 400;
    throw err;
  }

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from('email_otps')
    .select('id, code_hash, expires_at, used')
    .eq('email', email)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) {
    const err = new Error(migrationHint(error.message) || 'Could not verify that code.');
    err.status = 500;
    throw err;
  }

  const nextHash = hashCode(email, normalized);
  const match = (rows || []).find(row => (
    !row.used
    && new Date(row.expires_at).getTime() > Date.now()
    && hashesMatch(row.code_hash, nextHash)
  ));
  if (!match) {
    const err = new Error('That code is incorrect or has expired.');
    err.status = 400;
    throw err;
  }

  const { error: userError, data: savedUser } = await supabase.from('users').update({
    email_verified: true,
    email_verified_at: new Date().toISOString(),
  }).eq('id', uid).select('email_verified').single();
  if (userError || !savedUser?.email_verified) {
    const err = new Error(migrationHint(userError?.message) || 'Could not save verification.');
    err.status = 500;
    throw err;
  }
  await supabase.from('email_otps').update({ used: true }).eq('id', match.id);
}
