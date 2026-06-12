import { getFirebaseToken } from '../lib/firebase-auth.js';
import { loadSiteSettings } from '../lib/sources-loader.js';
import { resolveFacebookConfig } from '../lib/site-settings.js';
import { onArticlePublished } from '../lib/on-article-published.js';

function parseTimestamp(field) {
  if (!field) return null;
  if (field.timestampValue) return field.timestampValue;
  return null;
}

export async function handleDistribute(env, articleId) {
  const settings = await loadSiteSettings(env);
  const token = await getFirebaseToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/articles/${articleId}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!data.fields) return;

  const article = {
    id: articleId,
    title: data.fields.title?.stringValue || '',
    summary: data.fields.summary?.stringValue || '',
    slug: data.fields.slug?.stringValue || '',
    category: data.fields.category?.stringValue || '',
    imageUrl: data.fields.imageUrl?.stringValue || '',
    score: parseInt(data.fields.score?.integerValue || '5', 10),
    qualityScore: parseFloat(data.fields.qualityScore?.doubleValue || data.fields.qualityScore?.integerValue || '0'),
    editorialStatus: data.fields.editorialStatus?.stringValue || '',
    telegramPostedAt: parseTimestamp(data.fields.telegramPostedAt),
    publishedAt: parseTimestamp(data.fields.publishedAt),
  };

  await onArticlePublished(env, article, token, settings);

  const fb = resolveFacebookConfig(settings, env);
  if (fb.enabled && fb.hasToken && article.score >= fb.minScore) {
    const siteUrl = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';
    const articleUrl = `${siteUrl}/article/${encodeURIComponent(article.slug)}`;
    await fetch(`https://graph.facebook.com/v18.0/${env.FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${article.title}\n\n${article.summary}`,
        link: articleUrl,
        access_token: env.FACEBOOK_PAGE_TOKEN,
      }),
    }).catch((err) => console.error('Facebook distribute failed:', err.message));
  }
}
