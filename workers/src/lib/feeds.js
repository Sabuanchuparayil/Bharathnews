/** Fallback feeds when Firestore sources collection is empty */

export const FALLBACK_RSS_FEEDS = [
  // India
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', category: 'india', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu', category: 'india', region: 'india', language: 'en' },
  // GCC
  { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', category: 'gcc', region: 'saudi', language: 'en' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'gcc', region: 'qatar', language: 'en' },
  { url: 'https://gulfnews.com/rss', name: 'Gulf News', category: 'gcc', region: 'uae', language: 'en' },
  // World
  { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'world', region: 'global', language: 'en' },
  // Business
  { url: 'https://economictimes.indiatimes.com/rss.cms', name: 'Economic Times', category: 'business', region: 'india', language: 'en' },
  { url: 'https://www.business-standard.com/rss', name: 'Business Standard', category: 'business', region: 'india', language: 'en' },
  // Technology
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'technology', region: 'global', language: 'en' },
  { url: 'https://yourstory.com/feed', name: 'YourStory', category: 'technology', region: 'india', language: 'en' },
  // Sports
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', name: 'ESPN Cricinfo', category: 'sports', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/sport/feeder/default.rss', name: 'The Hindu Sports', category: 'sports', region: 'india', language: 'en' },
  // Entertainment
  { url: 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml', name: 'HT Entertainment', category: 'entertainment', region: 'india', language: 'en' },
  { url: 'https://indianexpress.com/section/entertainment/feed/', name: 'IE Entertainment', category: 'entertainment', region: 'india', language: 'en' },
  // Health
  { url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss', name: 'The Hindu Health', category: 'health', region: 'india', language: 'en' },
  { url: 'https://indianexpress.com/section/lifestyle/health-wellness/feed/', name: 'IE Health', category: 'health', region: 'india', language: 'en' },
  // Education
  { url: 'https://www.ndtv.com/education/rss', name: 'NDTV Education', category: 'education', region: 'india', language: 'en' },
  { url: 'https://indianexpress.com/section/education/feed/', name: 'IE Education', category: 'education', region: 'india', language: 'en' },
  // Jobs
  { url: 'https://economictimes.indiatimes.com/jobs/rssfeeds/13357270.cms', name: 'ET Jobs', category: 'jobs', region: 'india', language: 'en' },
  { url: 'https://www.khaleejtimes.com/rss/jobs', name: 'Khaleej Times Jobs', category: 'jobs', region: 'gcc', language: 'en' },
  // Real Estate
  { url: 'https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/48997553.cms', name: 'ET Real Estate', category: 'realestate', region: 'india', language: 'en' },
  { url: 'https://gulfnews.com/business/property/rss', name: 'Gulf News Property', category: 'realestate', region: 'gcc', language: 'en' },
  // Lifestyle
  { url: 'https://www.thehindu.com/life-and-style/feeder/default.rss', name: 'The Hindu Lifestyle', category: 'lifestyle', region: 'india', language: 'en' },
  { url: 'https://gulfnews.com/lifestyle/rss', name: 'Gulf News Lifestyle', category: 'lifestyle', region: 'gcc', language: 'en' },
  // Opinion
  { url: 'https://indianexpress.com/section/opinion/feed/', name: 'IE Opinion', category: 'opinion', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/opinion/feeder/default.rss', name: 'The Hindu Opinion', category: 'opinion', region: 'india', language: 'en' },
];

export const FALLBACK_YOUTUBE_CHANNELS = [
  { channelId: 'UCef1-8eOpJgud7BB6sDkibg', name: 'NDTV', category: 'india', language: 'en' },
  { channelId: 'UCIvaYmXn910QMdemBG3v1pQ', name: 'Al Jazeera English', category: 'gcc', language: 'en' },
];

/** @deprecated Use loadEnabledSources from sources-loader.js */
export const RSS_FEEDS = FALLBACK_RSS_FEEDS;
export const YOUTUBE_CHANNELS = FALLBACK_YOUTUBE_CHANNELS;
