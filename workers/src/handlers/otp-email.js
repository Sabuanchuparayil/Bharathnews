import { resolveEmailConfig } from '../lib/site-settings.js';
import { loadSiteSettings } from '../lib/sources-loader.js';

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

export async function handleOtpEmail(env, body) {
  const to = (body?.to || '').trim().toLowerCase();
  const code = String(body?.code || '').replace(/\D/g, '');
  if (!isValidEmail(to) || code.length !== 6) {
    throw new Error('A valid recipient and 6-digit code are required.');
  }
  if (!env.RESEND_API_KEY) {
    throw new Error('Email service is not configured.');
  }

  const settings = await loadSiteSettings(env);
  const emailCfg = resolveEmailConfig(settings, env);
  const from = emailCfg.from || 'The Bharath News <news@thebharathnews.com>';
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;max-width:480px">
      <h2 style="color:#0D7377">Verify your email</h2>
      <p>Use this code to finish signing in to The Bharath News. It expires in 10 minutes.</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0">${code}</p>
      <p style="color:#666;font-size:13px">If you did not try to sign in, you can ignore this email.</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your Bharath News verification code',
      html,
    }),
  });

  if (!res.ok) {
    console.error('OTP email failed:', (await res.text()).slice(0, 200));
    throw new Error('Could not send the verification email.');
  }

  return { ok: true };
}
