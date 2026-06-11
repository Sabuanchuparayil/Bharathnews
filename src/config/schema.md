## Firestore Collections

### articles/{articleId}
{
  title: string,
  slug: string,
  summary: string,
  fullContent: string,
  fullContent_ml: string,
  fullContent_ar: string,
  imageUrl: string,
  category: string,
  topics: string[],
  source: string,
  sourceUrl: string,
  author: string,
  publishedAt: timestamp,
  createdAt: timestamp,
  score: number,
  views: number,
  likes: number,
  comments: number,
  shares: number,
  language: string,
  seo: { metaTitle, metaDescription, keywords, ogImage },
  distributed: { telegram, facebook, instagram, youtube, whatsapp },
  socialFormats: { whatsapp, telegram, instagram, facebook, pushNotification }
}

### users/{userId}
{
  displayName, email, photoURL, role, language, createdAt, lastActiveAt,
  bookmarks: string[],
  interests: { categories, topics, sources, readingTimes },
  aiProfile, notifications: { enabled, categories, frequency }
}

### users/{userId}/history/{historyId}
{ articleId, action, duration, timestamp }

### videos/{videoId}
{ title, videoId, channelName, channelId, thumbnail, duration, publishedAt, fetchedAt, category, embedUrl, views }

### settings/site
{ headerText, footerText, logoUrl, categories, topics, adSlots }
