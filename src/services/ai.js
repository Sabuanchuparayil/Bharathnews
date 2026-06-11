const WORKER_BASE = import.meta.env.VITE_WORKER_URL || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callWorkerAI(endpoint, payload) {
  const response = await fetch(`${WORKER_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Worker AI error: ${response.status}`);
  }

  return response.json();
}

async function callGroq(prompt, maxTokens = 256) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function chatWithAI(userMessage) {
  const prompt = `You are a helpful news assistant for The Bharath News, covering India and GCC regions. Answer concisely in 2-3 sentences. User asks: ${userMessage}`;
  return callGroq(prompt);
}

export async function summarizeArticle(title, description, source) {
  const prompt = `You are a senior news editor for The Bharath News, covering India and GCC regions.
Given this news headline and summary from ${source}, write an ORIGINAL 200-word news article.
Add context about why this matters to Indian expatriates in GCC countries.
Maintain professional journalistic tone. Do NOT copy phrases from the source.
Include a compelling opening line.

Headline: ${title}
Summary: ${description}

Respond in this exact JSON format:
{
  "fullContent": "your 200-word article",
  "summary": "2-sentence summary for card display",
  "topics": ["topic1", "topic2", "topic3"],
  "score": 7
}

The score should be 1-10 based on: importance to India-GCC audience (40%), trending potential (30%), and timeliness (30%).`;

  const result = await callGroq(prompt, 2048);
  try {
    return JSON.parse(result.replace(/```json\n?|\n?```/g, ''));
  } catch {
    return { fullContent: result, summary: description, topics: [], score: 5 };
  }
}

export async function translateArticle(content, targetLang) {
  const langName = targetLang === 'ml' ? 'Malayalam' : 'Arabic';
  const prompt = `Translate the following news article to ${langName}. 
Maintain journalistic tone and accuracy. Keep proper nouns in English.

Article:
${content}

Respond with ONLY the translated text, no explanations.`;

  return callGroq(prompt, 2048);
}

export async function generateSEO(title, summary, category) {
  const prompt = `Generate SEO metadata for this news article:
Title: ${title}
Summary: ${summary}
Category: ${category}

Respond in this exact JSON format:
{
  "metaTitle": "SEO-optimized title under 60 chars",
  "metaDescription": "Meta description under 155 chars",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "slug": "url-friendly-slug-from-title"
}`;

  const result = await callGroq(prompt, 512);
  try {
    return JSON.parse(result.replace(/```json\n?|\n?```/g, ''));
  } catch {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
    return { metaTitle: title, metaDescription: summary, keywords: [], slug };
  }
}

export async function generateChannelFormats(title, summary, category, articleUrl) {
  const prompt = `Generate social media posts for this news article. Each must be unique and platform-optimized.

Title: ${title}
Summary: ${summary}
Category: ${category}
URL: ${articleUrl}

Respond in this exact JSON format:
{
  "whatsapp": "2 lines max with emoji headline, URL at end",
  "telegram": "Bold title, 3-4 lines with formatting, include URL",
  "instagram": "Engaging caption with 5 relevant hashtags and CTA",
  "facebook": "Conversational 2-3 lines with URL",
  "pushNotification": "Under 60 characters, urgent but not clickbait"
}`;

  const result = await callGroq(prompt, 1024);
  try {
    return JSON.parse(result.replace(/```json\n?|\n?```/g, ''));
  } catch {
    return {
      whatsapp: `📰 ${title}\n${articleUrl}`,
      telegram: `<b>${title}</b>\n\n${summary}\n\n<a href="${articleUrl}">Read more</a>`,
      instagram: `${summary} #TheBharathNews #${category}`,
      facebook: `${title}\n\n${summary}\n\n${articleUrl}`,
      pushNotification: title.slice(0, 60),
    };
  }
}

export async function generateUserProfile(readingHistory) {
  const prompt = `Based on this user's reading history, generate a 2-sentence reader profile describing their interests and preferences:

Reading history (last 30 articles):
${readingHistory.map(h => `- ${h.category}: ${h.title}`).join('\n')}

Respond with ONLY the 2-sentence profile, no formatting.`;

  return callGroq(prompt, 200);
}
