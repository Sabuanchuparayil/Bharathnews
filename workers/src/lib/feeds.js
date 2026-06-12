/** Fallback feeds when Firestore sources collection is empty */

export const FALLBACK_RSS_FEEDS = [
  // India
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', category: 'india', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu', category: 'india', region: 'india', language: 'en' },
  { url: 'https://indianexpress.com/section/india/feed/', name: 'Indian Express', category: 'india', region: 'india', language: 'en' },
  // GCC (direct feeds — Google News is blocked from datacenter IPs)
  { url: 'https://saudigazette.com.sa/rssFeed/74', name: 'Saudi Gazette', category: 'gcc', region: 'saudi', language: 'en' },
  { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', category: 'gcc', region: 'saudi', language: 'en' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'gcc', region: 'qatar', language: 'en' },
  // Regional (OneIndia direct + Google News via rss2json proxy)
  { url: 'https://malayalam.oneindia.com/rss/malayalam-news-fb.xml', name: 'OneIndia Malayalam', category: 'india', region: 'kerala', language: 'ml' },
  { url: 'https://hindi.oneindia.com/rss/hindi-news-fb.xml', name: 'OneIndia Hindi', category: 'india', region: 'india', language: 'hi' },
  { url: 'https://news.google.com/rss?hl=ml-IN&gl=IN&ceid=IN:ml', name: 'Google News Kerala', category: 'india', region: 'kerala', language: 'ml' },
  { url: 'https://news.google.com/rss?hl=hi-IN&gl=IN&ceid=IN:hi', name: 'Google News Hindi', category: 'india', region: 'india', language: 'hi' },
  // World
  { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'world', region: 'global', language: 'en' },
  // Business
  { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', name: 'Economic Times', category: 'business', region: 'india', language: 'en' },
  // Technology
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'technology', region: 'global', language: 'en' },
  // Sports
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', name: 'ESPN Cricinfo', category: 'sports', region: 'india', language: 'en' },
  // Entertainment
  { url: 'https://indianexpress.com/section/entertainment/feed/', name: 'IE Entertainment', category: 'entertainment', region: 'india', language: 'en' },
  // Health
  { url: 'https://indianexpress.com/section/lifestyle/health-wellness/feed/', name: 'IE Health', category: 'health', region: 'india', language: 'en' },
  // Education
  { url: 'https://indianexpress.com/section/education/feed/', name: 'IE Education', category: 'education', region: 'india', language: 'en' },
  // Jobs
  { url: 'https://economictimes.indiatimes.com/jobs/rssfeeds/13357270.cms', name: 'ET Jobs', category: 'jobs', region: 'india', language: 'en' },
  // Real Estate
  { url: 'https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/48997553.cms', name: 'ET Real Estate', category: 'realestate', region: 'india', language: 'en' },
  // Lifestyle
  { url: 'https://www.thehindu.com/life-and-style/feeder/default.rss', name: 'The Hindu Lifestyle', category: 'lifestyle', region: 'india', language: 'en' },
  // Opinion
  { url: 'https://indianexpress.com/section/opinion/feed/', name: 'IE Opinion', category: 'opinion', region: 'india', language: 'en' },
];

export const FALLBACK_YOUTUBE_CHANNELS = [
  { channelId: 'UCZFMm1mMw0F81Z37aaEzTUA', name: 'NDTV', category: 'india', language: 'en' },
  { channelId: 'UCf8w5m0YsRa8MHQ5bwSGmbw', name: 'Asianet News', category: 'india', language: 'ml' },
  { channelId: 'UCP0uG-mcMImgKnJz-VjJZmQ', name: 'Manorama News', category: 'india', language: 'ml' },
  { channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', name: 'Al Jazeera English', category: 'gcc', language: 'en' },
];

/** @deprecated Use loadEnabledSources from sources-loader.js */
export const RSS_FEEDS = FALLBACK_RSS_FEEDS;
export const YOUTUBE_CHANNELS = FALLBACK_YOUTUBE_CHANNELS;
