function escapeHtml(s) {
  return String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

export function buildArticleTelegramMessage({ title, slug, excerpt, siteUrl }) {
  const url = `${siteUrl.replace(/\/$/, '')}/article/${encodeURIComponent(slug)}`;
  return (
    `📰 <b>${escapeHtml(title)}</b>\n\n` +
    (excerpt ? `${escapeHtml(excerpt)}\n\n` : '') +
    `<a href="${escapeHtml(url)}">Read more →</a>`
  );
}

export async function postArticleToTelegram(env, article, channelId) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = channelId || env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID;
  if (!token || !chatId) {
    throw new Error('Telegram env vars missing');
  }

  const text = buildArticleTelegramMessage(article);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Telegram post failed:', body);
    throw new Error('Telegram post failed');
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
