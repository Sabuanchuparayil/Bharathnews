## Firestore Collections

### articles/{articleId}
{
  title: string,
  slug: string,
  summary: string,
  fullContent: string,
  translations: {
    ml: { title, summary, fullContent },
    ta: { title, summary, fullContent },
    te: { title, summary, fullContent },
    kn: { title, summary, fullContent },
    hi: { title, summary, fullContent },
    ar: { title, summary, fullContent }
  },
  imageUrl: string,
  category: string,
  topics: string[],
  source: string,
  sourceUrl: string,
  author: string,
  publishedAt: timestamp,
  createdAt: timestamp,
  language: string,          // original language code: en|ml|ta|te|kn|hi|ar
  region: string,            // india|gcc|kerala|uae|saudi|global|...
  qualityScore: number,      // 0-10 from Claude Haiku
  score: number,             // legacy display score
  editorialStatus: string,   // published|rejected|duplicate
  clusterId: string,         // dedup cluster key
  views: number,
  likes: number,
  comments: number,
  shares: number,
  seo: { metaTitle, metaDescription, keywords, ogImage },
  distributed: { telegram, facebook, instagram, youtube, whatsapp },
  socialFormats: { whatsapp, telegram, instagram, facebook, pushNotification }
}

### raw_articles/{slug}
{
  title, description, sourceUrl, source, category, region, language,
  slug, imageUrl, status,           // pending_ai|processing|classified|rejected|duplicate|processed
  editorialStatus, qualityScore, topics[], clusterId, dedupKey,
  detectedLanguage, publishedAt, createdAt
}

### sources/{sourceId}
{
  url: string,
  name: string,
  type: string,              // rss|googlenews|youtube
  category: string,
  region: string,
  language: string,          // en|ml|ta|te|kn|hi|ar
  enabled: boolean,
  trustWeight: number,       // 0-1
  channelId: string,         // for youtube type
  lastFetchedAt: timestamp,
  lastError: string,
  itemCount: number
}

### settings/site
{
  headerText, footerText, logoUrl,
  categories: string[],
  topics: string[],
  adSlots: { header, sidebar, articleTop, articleBottom },
  qualityThreshold: number,  // default 6
  targetLanguages: string[], // ml,ta,te,kn,hi,ar
  monetization: { adsensePublisherId, resendEnabled }
}

### sponsors/{sponsorId}
{
  title, description, imageUrl, linkUrl, sponsoredBy,
  category, placement,        // sidebar|article|hero
  active: boolean,
  startDate, endDate
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

### subscribers/{subId}
{ email, subscribedAt, source, language }
