import { SITE_URL } from '@/lib/site-url';

/** @typedef {{ title: string; url: string; excerpt?: string }} TgArticle */

function escapeHtml(s) {
  return String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

function resolveChatId() {
  return process.env.TELEGRAM_CHANNEL || process.env.TELEGRAM_CHANNEL_ID || '';
}

/**
 * Post a formatted article message to the Telegram channel (HTML parse mode).
 * @param {TgArticle} article
 */
export async function postToTelegram(article) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = resolveChatId();
  if (!token || !chatId) {
    throw new Error('Telegram env vars missing');
  }

  const text =
    `📰 <b>${escapeHtml(article.title)}</b>\n\n` +
    (article.excerpt ? `${escapeHtml(article.excerpt)}\n\n` : '') +
    `<a href="${escapeHtml(article.url)}">Read more →</a>`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Telegram post failed:', body);
    throw new Error('Telegram post failed');
  }

  return res.json();
}

/** Build canonical article URL for Telegram links. */
export function articleTelegramUrl(slug) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL).replace(/\/$/, '');
  return `${base}/article/${encodeURIComponent(slug)}`;
}
