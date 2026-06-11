import { RSS_FEEDS } from '../lib/feeds.js';

export async function handleRSSIngest(env) {
  const results = [];

  for (const feed of RSS_FEEDS) {
    try {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== 'ok') continue;

      for (const item of data.items.slice(0, 5)) {
        const article = {
          title: item.title,
          description: item.description?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
          sourceUrl: item.link,
          source: feed.name,
          category: feed.category,
          region: feed.region,
          publishedAt: item.pubDate,
          imageUrl: item.thumbnail || item.enclosure?.link || '',
          status: 'pending_ai',
        };

        await storeRawArticle(env, article);
        results.push(article.title);
      }
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error.message);
    }
  }

  await triggerAIProcessing(env);
  return results;
}

async function storeRawArticle(env, article) {
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/raw_articles`;
  const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);

  await fetch(firestoreUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.FIREBASE_TOKEN}`,
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: article.title },
        description: { stringValue: article.description },
        sourceUrl: { stringValue: article.sourceUrl },
        source: { stringValue: article.source },
        category: { stringValue: article.category },
        region: { stringValue: article.region },
        slug: { stringValue: slug },
        imageUrl: { stringValue: article.imageUrl },
        status: { stringValue: 'pending_ai' },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
}

async function triggerAIProcessing(env) {
  // AI process handler picks up pending articles
}
