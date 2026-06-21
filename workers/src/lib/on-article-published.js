import { postArticleToTelegram } from './telegram.js';
import { resolveTelegramConfig } from './site-settings.js';
import { supabaseHeaders } from './supabase-rest.js';

function isPublished(article) {
  const status = article.editorial_status || article.status || article.editorialStatus;
  return status === 'published' || (!status && (article.published_at || article.publishedAt));
}

function hasTelegramPosted(article) {
  return Boolean(article.telegram_posted_at || article.telegramPostedAt || article.distributed?.telegram);
}

async function markTelegramPosted(env, article) {
  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const articleId = article.id;
  if (!articleId) return;
  const res = await fetch(`${base}/articles?id=eq.${articleId}`, {
    method: 'PATCH',
    headers: { ...supabaseHeaders(env), Prefer: 'return=minimal' },
    body: JSON.stringify({
      telegram_posted_at: new Date().toISOString(),
      distributed: { ...(typeof article.distributed === 'object' && article.distributed ? article.distributed : {}), telegram: true },
    }),
  });
  if (!res.ok) console.error('[markTelegramPosted] PATCH failed:', res.status, await res.text().catch(() => ''));
}

export async function onArticlePublished(env, article, _token, settings = {}) {
  if (!article?.id || !article?.slug || !article?.title) return;
  if (!isPublished(article) || hasTelegramPosted(article)) return;

  const tg = resolveTelegramConfig(settings, env);
  if (!tg.enabled || !tg.hasBotToken) return;

  const score = article.score ?? article.quality_score ?? article.qualityScore ?? 0;
  if (score < tg.minScore) return;

  const chatId = env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID || tg.channelId;
  const siteUrl = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';

  try {
    await postArticleToTelegram(env, {
      title: article.title,
      slug: article.slug,
      excerpt: article.summary || article.excerpt || '',
      image_url: article.image_url,
      imageUrl: article.imageUrl,
      category: article.category,
      source_url: article.source_url,
      siteUrl,
    }, chatId);
    await markTelegramPosted(env, article);
  } catch (err) {
    console.error('[onArticlePublished] Telegram post skipped:', err?.message || err);
  }
}
