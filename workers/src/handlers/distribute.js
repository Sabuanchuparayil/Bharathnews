import { getFirebaseToken } from '../lib/firebase-auth.js';
import { loadSiteSettings } from '../lib/sources-loader.js';
import { resolveTelegramConfig, resolveFacebookConfig } from '../lib/site-settings.js';

export async function handleDistribute(env, articleId) {
  const settings = await loadSiteSettings(env);
  const token = await getFirebaseToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/articles/${articleId}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  if (!data.fields) return;

  const article = {
    title: data.fields.title?.stringValue || '',
    summary: data.fields.summary?.stringValue || '',
    slug: data.fields.slug?.stringValue || '',
    category: data.fields.category?.stringValue || '',
    imageUrl: data.fields.imageUrl?.stringValue || '',
    score: parseInt(data.fields.score?.integerValue || '5', 10),
  };

  const siteUrl = env.MAIN_SITE_URL || 'https://thebharathnews.com';
  const articleUrl = `${siteUrl}/article/${encodeURIComponent(article.slug)}`;

  const tg = resolveTelegramConfig(settings, env);
  if (tg.enabled && tg.hasBotToken && article.score >= tg.minScore) {
    const msg = `<b>${escapeHtml(article.title)}</b>\n\n${escapeHtml(article.summary)}\n\n📰 <a href="${articleUrl}">Read Full Story</a>`;
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: tg.channelId, text: msg, parse_mode: 'HTML' }),
    });
  }

  const fb = resolveFacebookConfig(settings, env);
  if (fb.enabled && fb.hasToken && article.score >= fb.minScore) {
    await fetch(`https://graph.facebook.com/v18.0/${env.FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${article.title}\n\n${article.summary}`,
        link: articleUrl,
        access_token: env.FACEBOOK_PAGE_TOKEN,
      }),
    });
  }
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
