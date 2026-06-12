import { resolveEmailConfig } from '../lib/site-settings.js';
import { loadSiteSettings } from '../lib/sources-loader.js';

const CONTACT_TO = 'bharathnewsweb@gmail.com';
const MAX_MESSAGE = 5000;

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

export async function handleContactEmail(env, body) {
  if (body?.website) {
    return { ok: true, message: 'Thank you for your message.' };
  }

  const name = (body?.name || '').trim().slice(0, 120);
  const email = (body?.email || '').trim();
  const subject = (body?.subject || '').trim().slice(0, 200);
  const message = (body?.message || '').trim().slice(0, MAX_MESSAGE);
  const topic = (body?.topic || 'general').trim().slice(0, 40);

  if (!name || !isValidEmail(email) || !subject || message.length < 10) {
    throw new Error('Please fill in all fields with a valid email and message (min 10 characters).');
  }

  if (!env.RESEND_API_KEY) {
    throw new Error('Email service is not configured. Please email us directly at bharathnewsweb@gmail.com');
  }

  const settings = await loadSiteSettings(env);
  const emailCfg = resolveEmailConfig(settings, env);
  const from = emailCfg.from || 'The Bharath News <news@thebharathnews.com>';

  const html = `
    <h2>New contact message — The Bharath News</h2>
    <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr/>
    <pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;">${escapeHtml(message)}</pre>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to: CONTACT_TO,
      reply_to: email,
      subject: `[Contact / ${topic}] ${subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Contact email failed:', err.slice(0, 200));
    throw new Error('Failed to send message. Please try again or email bharathnewsweb@gmail.com directly.');
  }

  return { ok: true, message: 'Thank you! We received your message and will respond soon.' };
}
