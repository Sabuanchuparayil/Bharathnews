import { postToTelegram, articleTelegramUrl } from '@/lib/telegram';
import { markArticleTelegramPosted } from '@/lib/supabase-admin';

function isPublished(article) {
  const status = article.status || article.editorialStatus;
  return status === 'published' || (!status && article.publishedAt);
}

function hasTelegramPosted(article) {
  return Boolean(article.telegramPostedAt);
}

/**
 * Post to Telegram when an article first becomes published. Idempotent via telegramPostedAt.
 * Never throws — Telegram failures are logged and publishing continues.
 * @param {{ id: string; title: string; slug: string; summary?: string; excerpt?: string; status?: string; editorialStatus?: string; telegramPostedAt?: unknown; publishedAt?: unknown }} article
 */
export async function onArticlePublished(article) {
  if (!article?.id || !article?.slug || !article?.title) return;
  if (!isPublished(article) || hasTelegramPosted(article)) return;

  try {
    await postToTelegram({
      title: article.title,
      url: articleTelegramUrl(article.slug),
      excerpt: article.excerpt || article.summary || '',
    });
    await markArticleTelegramPosted(article.id);
  } catch (err) {
    console.error('Auto-post skipped:', err?.message || err);
  }
}
