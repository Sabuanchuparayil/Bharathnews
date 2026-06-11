import { getFirebaseToken } from '../lib/firebase-auth.js';
import { runQuery, FIRESTORE_BASE } from '../lib/firestore-rest.js';

export async function handleNewsletterDigest(env) {
  if (!env.RESEND_API_KEY) {
    console.log('Newsletter digest skipped: RESEND_API_KEY not set');
    return { sent: 0, skipped: true };
  }

  const token = await getFirebaseToken(env);
  const subscribers = await runQuery(env, {
    from: [{ collectionId: 'subscribers' }],
    limit: 500,
  }, token);

  const articles = await runQuery(env, {
    from: [{ collectionId: 'articles' }],
    orderBy: [{ field: { fieldPath: 'publishedAt' }, direction: 'DESCENDING' }],
    limit: 10,
  }, token);

  if (!subscribers.length || !articles.length) {
    return { sent: 0, reason: 'no subscribers or articles' };
  }

  const html = buildDigestHtml(articles);
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
          from: env.NEWSLETTER_FROM || 'The Bharath News <news@thebharathnews.com>',
          to: sub.email,
          subject: 'Your Weekly Digest — The Bharath News',
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

function buildDigestHtml(articles) {
  const items = articles.map(a =>
    `<li><a href="https://thebharathnews.com/article/${a.slug}">${a.title}</a><br/><small>${a.summary?.slice(0, 120) || ''}</small></li>`
  ).join('');
  return `<h1>The Bharath News — Weekly Digest</h1><ul>${items}</ul><p><a href="https://thebharathnews.com">Read more</a></p>`;
}
