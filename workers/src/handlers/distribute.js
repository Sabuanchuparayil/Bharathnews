export async function handleDistribute(env, articleId) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/articles/${articleId}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.fields) return;

  const article = {
    title: data.fields.title?.stringValue || '',
    summary: data.fields.summary?.stringValue || '',
    slug: data.fields.slug?.stringValue || '',
    category: data.fields.category?.stringValue || '',
    imageUrl: data.fields.imageUrl?.stringValue || '',
    score: parseInt(data.fields.score?.integerValue || '5'),
  };

  const articleUrl = `https://thebharathnews.com/article/${article.slug}`;

  if (article.score >= 5) {
    const msg = `<b>${article.title}</b>\n\n${article.summary}\n\n📰 <a href="${articleUrl}">Read Full Story</a>`;
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHANNEL_ID, text: msg, parse_mode: 'HTML' }),
    });
  }

  if (article.score >= 7 && env.FACEBOOK_PAGE_TOKEN) {
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
