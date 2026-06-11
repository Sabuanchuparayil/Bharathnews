const WORKER_BASE = process.env.NEXT_PUBLIC_WORKER_URL || '';

async function callWorkerAI(endpoint, payload) {
  if (!WORKER_BASE) {
    throw new Error('AI service not configured');
  }
  const response = await fetch(`${WORKER_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI service error: ${response.status}`);
  }

  return response.json();
}

export async function chatWithAI(userMessage) {
  const data = await callWorkerAI('/api/chat', { message: userMessage });
  return data.reply || data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';
}

export async function summarizeArticle(title, description, source) {
  try {
    const data = await callWorkerAI('/api/summarize', { title, description, source });
    return data;
  } catch {
    return { fullContent: description, summary: description, topics: [], score: 5 };
  }
}

export async function translateArticle(content, targetLang) {
  const data = await callWorkerAI('/api/translate', { content, targetLang });
  return data.translation || content;
}

export async function generateSEO(title, summary, category) {
  try {
    const data = await callWorkerAI('/api/seo', { title, summary, category });
    return data;
  } catch {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
    return { metaTitle: title, metaDescription: summary, keywords: [], slug };
  }
}

export async function generateChannelFormats(title, summary, category, articleUrl) {
  try {
    const data = await callWorkerAI('/api/channel-formats', { title, summary, category, articleUrl });
    return data;
  } catch {
    return {
      whatsapp: `📰 ${title}\n${articleUrl}`,
      telegram: `${title}\n\n${summary}\n\n${articleUrl}`,
      instagram: `${summary} #TheBharathNews #${category}`,
      facebook: `${title}\n\n${summary}\n\n${articleUrl}`,
      pushNotification: title.slice(0, 60),
    };
  }
}

export async function generateUserProfile(readingHistory) {
  const data = await callWorkerAI('/api/user-profile', { readingHistory });
  return data.profile || '';
}
