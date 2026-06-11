import { callAI } from '../lib/gemini.js';

export async function handleAIProcess(env) {
  const pendingUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/raw_articles?pageSize=10`;

  const response = await fetch(pendingUrl);
  const data = await response.json();
  const documents = data.documents || [];

  for (const doc of documents) {
    const fields = doc.fields;
    if (fields.status?.stringValue !== 'pending_ai') continue;

    const title = fields.title?.stringValue || '';
    const description = fields.description?.stringValue || '';
    const source = fields.source?.stringValue || '';
    const category = fields.category?.stringValue || '';
    const imageUrl = fields.imageUrl?.stringValue || '';
    const slug = fields.slug?.stringValue || '';

    const prompt = `You are a news editor for The Bharath News (India-GCC focused).
Given this headline and summary from ${source}, write an ORIGINAL 200-word article.
Add context for Indian expats in GCC. Professional tone. Do NOT copy source phrases.

Headline: ${title}
Summary: ${description}

Respond in JSON:
{"fullContent":"article text","summary":"2 sentences","topics":["t1","t2","t3"],"score":7,"fullContent_ml":"Malayalam translation of article"}`;

    const text = await callAI(env, prompt);

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { fullContent: text, summary: description, topics: [], score: 5, fullContent_ml: '' };
    }

    const publishUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/articles`;

    await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          title: { stringValue: title },
          slug: { stringValue: slug },
          summary: { stringValue: parsed.summary },
          fullContent: { stringValue: parsed.fullContent },
          fullContent_ml: { stringValue: parsed.fullContent_ml || '' },
          imageUrl: { stringValue: imageUrl },
          category: { stringValue: category },
          source: { stringValue: source },
          author: { stringValue: 'The Bharath News AI' },
          score: { integerValue: String(parsed.score || 5) },
          views: { integerValue: '0' },
          likes: { integerValue: '0' },
          comments: { integerValue: '0' },
          shares: { integerValue: '0' },
          topics: { arrayValue: { values: (parsed.topics || []).map(t => ({ stringValue: t })) } },
          publishedAt: { timestampValue: new Date().toISOString() },
          distributed: { mapValue: { fields: {
            telegram: { booleanValue: false },
            facebook: { booleanValue: false },
            whatsapp: { booleanValue: false },
          }}},
        },
      }),
    });

    if ((parsed.score || 5) >= 7) {
      await distributeToChannels(env, { title, summary: parsed.summary, slug, category, imageUrl });
    }
  }
}

async function distributeToChannels(env, article) {
  const telegramMsg = `<b>${article.title}</b>\n\n${article.summary}\n\n📰 <a href="https://thebharathnews.com/article/${article.slug}">Read Full Story</a>\n\n#${article.category} #TheBharathNews`;

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHANNEL_ID,
      text: telegramMsg,
      parse_mode: 'HTML',
    }),
  });
}
