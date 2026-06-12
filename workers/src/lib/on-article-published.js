import { FIRESTORE_BASE } from './firestore-rest.js';
import { postArticleToTelegram } from './telegram.js';
import { resolveTelegramConfig } from './site-settings.js';

function isPublished(article) {
  const status = article.status || article.editorialStatus;
  return status === 'published' || (!status && article.publishedAt);
}

function hasTelegramPosted(article) {
  return Boolean(article.telegramPostedAt);
}

async function markTelegramPosted(env, articleId, token) {
  const now = new Date().toISOString();
  await fetch(
    `${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/articles/${encodeURIComponent(articleId)}?updateMask.fieldPaths=telegramPostedAt&updateMask.fieldPaths=distributed.telegram`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fields: {
          telegramPostedAt: { timestampValue: now },
          distributed: {
            mapValue: {
              fields: {
                telegram: { booleanValue: true },
              },
            },
          },
        },
      }),
    },
  );
}

/**
 * Idempotent Telegram auto-post when an article is first published.
 * @param {object} env - Worker env bindings
 * @param {object} article - { id, title, slug, summary, editorialStatus, telegramPostedAt, score }
 * @param {string} token - Firebase auth token
 * @param {object} [settings] - Site settings for min score / channel config
 */
export async function onArticlePublished(env, article, token, settings = {}) {
  if (!article?.id || !article?.slug || !article?.title) return;
  if (!isPublished(article) || hasTelegramPosted(article)) return;

  const tg = resolveTelegramConfig(settings, env);
  if (!tg.enabled || !tg.hasBotToken) return;

  const score = article.score ?? article.qualityScore ?? 0;
  if (score < tg.minScore) return;

  const chatId = env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID || tg.channelId;
  const siteUrl = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';

  try {
    await postArticleToTelegram(env, {
      title: article.title,
      slug: article.slug,
      excerpt: article.summary || article.excerpt || '',
      siteUrl,
    }, chatId);
    await markTelegramPosted(env, article.id, token);
  } catch (err) {
    console.error('Auto-post skipped:', err?.message || err);
  }
}
