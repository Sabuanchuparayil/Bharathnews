import { resolveSocialImageUrl } from './image-resolver.js';

const TELEGRAM_CAPTION_MAX = 1024;

function escapeHtml(s) {
  return String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

function truncateForTelegram(text, maxLen) {
  const s = String(text || '').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

export function buildArticleTelegramMessage({ title, slug, excerpt, siteUrl }, { maxLen = TELEGRAM_CAPTION_MAX } = {}) {
  const url = `${siteUrl.replace(/\/$/, '')}/article/${encodeURIComponent(slug)}`;
  const footer = `\n\n<a href="${escapeHtml(url)}">Read more →</a>`;
  const titleBlock = `📰 <b>${escapeHtml(truncateForTelegram(title, 200))}</b>`;
  const budget = maxLen - titleBlock.length - footer.length - 2;
  const excerptBlock = excerpt && budget > 20
    ? `\n\n${escapeHtml(truncateForTelegram(excerpt, budget))}`
    : '';
  return `${titleBlock}${excerptBlock}${footer}`;
}

async function parseTelegramError(response) {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body);
    return parsed.description || body.slice(0, 200);
  } catch {
    return body.slice(0, 200) || `HTTP ${response.status}`;
  }
}

export async function postArticleToTelegram(env, article, channelId) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = channelId || env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID;
  if (!token || !chatId) {
    throw new Error('Telegram env vars missing');
  }

  const siteUrl = article.siteUrl || env.MAIN_SITE_URL || 'https://www.thebharathnews.com';
  const text = buildArticleTelegramMessage({ ...article, siteUrl });
  const imageUrl = resolveSocialImageUrl(article, siteUrl);

  let response;
  if (imageUrl?.startsWith('http')) {
    response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: imageUrl,
        caption: text,
        parse_mode: 'HTML',
      }),
    });
  }

  if (!response?.ok) {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });
  }

  if (!response.ok) {
    const detail = await parseTelegramError(response);
    console.error('Telegram post failed:', detail);

    // Retry plain text if HTML parsing failed
    if (/can't parse entities|parse entities/i.test(detail)) {
      const plain = buildArticleTelegramMessage({ ...article, excerpt: '' }, { maxLen: 4096 })
        .replace(/<[^>]+>/g, '');
      const plainRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: plain,
          disable_web_page_preview: false,
        }),
      });
      if (plainRes.ok) return plainRes.json();
      throw new Error(await parseTelegramError(plainRes));
    }

    throw new Error(detail || 'Telegram post failed');
  }

  return response.json();
}

/** @deprecated Use postArticleToTelegram */
export async function postToTelegram(env, message, channelId) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = channelId || env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });

  return response.json();
}

export async function postPhotoToTelegram(env, imageUrl, caption, channelId) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelId || env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID,
      photo: imageUrl,
      caption,
      parse_mode: 'HTML',
    }),
  });

  return response.json();
}
