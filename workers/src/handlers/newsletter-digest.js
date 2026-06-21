import { selectRows } from '../lib/supabase-rest.js';
import { loadSiteSettings } from '../lib/sources-loader.js';
import { resolveEmailConfig } from '../lib/site-settings.js';

export async function handleNewsletterDigest(env) {
  const settings = await loadSiteSettings(env);
  const emailCfg = resolveEmailConfig(settings, env);

  if (!emailCfg.enabled) {
    console.log('Newsletter digest skipped: disabled in site settings');
    return { sent: 0, skipped: true, reason: 'disabled' };
  }

  if (!emailCfg.hasApiKey) {
    console.log('Newsletter digest skipped: RESEND_API_KEY not set');
    return { sent: 0, skipped: true, reason: 'no_api_key' };
  }

  const subscribers = await selectRows(env, 'subscribers', { limit: 500 });
  const articles = await selectRows(env, 'articles', {
    filters: { editorial_status: 'published' },
    order: 'published_at',
    ascending: false,
    limit: 10,
  });

  if (!subscribers.length || !articles.length) {
    return { sent: 0, reason: 'no subscribers or articles' };
  }

  const siteUrl = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';
  const html = buildDigestHtml(articles, siteUrl);
  let sent = 0;

  for (const sub of subscribers.slice(0, 100)) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: emailCfg.from,
          to: sub.email,
          subject: emailCfg.subject,
          html,
        }),
      });
      if (res.ok) sent++;
    } catch (err) {
      console.error(`Newsletter failed for ${sub.email}:`, err.message);
    }
  }

  console.log(`Newsletter digest sent to ${sent} subscribers`);
  return { sent };
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildDigestHtml(articles, siteUrl) {
  const items = articles.map(a => {
    const slug = encodeURIComponent(a.slug || '');
    return `<li><a href="${siteUrl}/article/${slug}">${escapeHtml(a.title)}</a><br/><small>${escapeHtml((a.summary || '').slice(0, 120))}</small></li>`;
  }).join('');
  return `<h1>The Bharath News — Weekly Digest</h1><ul>${items}</ul><p><a href="${siteUrl}">Read more</a></p>`;
}
