export async function postToTelegram(env, message, channelId) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: channelId || env.TELEGRAM_CHANNEL_ID,
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
      chat_id: channelId || env.TELEGRAM_CHANNEL_ID,
      photo: imageUrl,
      caption: caption,
      parse_mode: 'HTML',
    }),
  });

  return response.json();
}
