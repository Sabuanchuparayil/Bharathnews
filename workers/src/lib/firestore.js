export async function storeArticle(env, article) {
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/articles`;

  await fetch(firestoreUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.FIREBASE_TOKEN}`,
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: article.title },
        slug: { stringValue: article.slug },
        summary: { stringValue: article.summary },
        fullContent: { stringValue: article.fullContent },
        source: { stringValue: article.source },
        sourceUrl: { stringValue: article.sourceUrl },
        category: { stringValue: article.category },
        imageUrl: { stringValue: article.imageUrl },
        topics: { arrayValue: { values: (article.topics || []).map(t => ({ stringValue: t })) } },
        score: { doubleValue: article.score },
        views: { integerValue: '0' },
        likes: { integerValue: '0' },
        comments: { integerValue: '0' },
        language: { stringValue: 'en' },
        publishedAt: { timestampValue: new Date().toISOString() },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
}
