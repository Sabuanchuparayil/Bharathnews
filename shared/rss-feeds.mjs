/**
 * Canonical RSS feed registry — used by frontend config, worker ingest, and source seeding.
 * Each feed maps to a legacy DB category + optional subcategory for the new taxonomy.
 */
export const RSS_FEEDS = [
  // ── World > India ──
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', category: 'india', subcategory: 'india', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu', category: 'india', subcategory: 'india', region: 'india', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', name: 'Times of India', category: 'india', subcategory: 'india', region: 'india', language: 'en' },
  { url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', name: 'Hindustan Times', category: 'india', subcategory: 'india', region: 'india', language: 'en' },
  { url: 'https://www.livemint.com/rss/news', name: 'Livemint', category: 'india', subcategory: 'india', region: 'india', language: 'en' },
  { url: 'https://www.thenewsminute.com/feed', name: 'The News Minute', category: 'india', subcategory: 'india', region: 'kerala', language: 'en' },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', name: 'BBC India', category: 'india', subcategory: 'india', region: 'india', language: 'en' },
  // ── World > Gulf ──
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'gcc', subcategory: 'gulf', region: 'qatar', language: 'en' },
  { url: 'https://saudigazette.com.sa/rssFeed/74', name: 'Saudi Gazette', category: 'gcc', subcategory: 'gulf', region: 'saudi', language: 'en' },
  { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', category: 'gcc', subcategory: 'gulf', region: 'saudi', language: 'en' },
  { url: 'https://dohanews.co/feed/', name: 'Doha News', category: 'gcc', subcategory: 'gulf', region: 'qatar', language: 'en' },
  { url: 'https://gulfnews.com/feed', name: 'Gulf News', category: 'gcc', subcategory: 'gulf', region: 'uae', language: 'en' },
  { url: 'https://www.thenationalnews.com/arc/outboundfeeds/rss/?outputType=xml', name: 'The National', category: 'gcc', subcategory: 'gulf', region: 'uae', language: 'en' },
  // ── Money ──
  { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', name: 'Economic Times', category: 'business', subcategory: 'business', region: 'india', language: 'en' },
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', name: 'ET Markets', category: 'business', subcategory: 'markets', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/business/feeder/default.rss', name: 'The Hindu Business', category: 'business', subcategory: 'business', region: 'india', language: 'en' },
  { url: 'https://economictimes.indiatimes.com/jobs/rssfeeds/13357270.cms', name: 'ET Jobs', category: 'jobs', subcategory: 'jobs', region: 'india', language: 'en' },
  { url: 'https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/48997553.cms', name: 'ET Real Estate', category: 'realestate', subcategory: 'realestate', region: 'india', language: 'en' },
  // ── Tech ──
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'technology', subcategory: 'startups', region: 'global', language: 'en' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'technology', subcategory: 'gadgets', region: 'global', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms', name: 'TOI Tech', category: 'technology', subcategory: 'ai-tech', region: 'india', language: 'en' },
  // ── Sports ──
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', name: 'ESPN Cricinfo', category: 'sports', subcategory: 'cricket', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/sport/feeder/default.rss', name: 'The Hindu Sports', category: 'sports', subcategory: 'other', region: 'india', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', name: 'TOI Sports', category: 'sports', subcategory: 'other', region: 'india', language: 'en' },
  // ── Life ──
  { url: 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml', name: 'HT Entertainment', category: 'entertainment', subcategory: 'entertainment', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/entertainment/feeder/default.rss', name: 'The Hindu Entertainment', category: 'entertainment', subcategory: 'entertainment', region: 'india', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', name: 'TOI Entertainment', category: 'entertainment', subcategory: 'entertainment', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss', name: 'The Hindu Health', category: 'health', subcategory: 'health', region: 'india', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms', name: 'TOI Education', category: 'education', subcategory: 'education', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/education/feeder/default.rss', name: 'The Hindu Education', category: 'education', subcategory: 'education', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/life-and-style/feeder/default.rss', name: 'The Hindu Lifestyle', category: 'lifestyle', subcategory: 'food-travel', region: 'india', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/2886704.cms', name: 'TOI Lifestyle', category: 'lifestyle', subcategory: 'food-travel', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/opinion/feeder/default.rss', name: 'The Hindu Opinion', category: 'opinion', subcategory: 'opinion', region: 'india', language: 'en' },
  // ── World > Global ──
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'world', subcategory: 'global', region: 'global', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', name: 'TOI World', category: 'world', subcategory: 'global', region: 'india', language: 'en' },
];

/** Google News topic feeds — fill subcategory gaps not covered by dedicated RSS */
export const GOOGLE_NEWS_TOPIC_FEEDS = [
  { url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News India EN', category: 'india', subcategory: 'india', region: 'india', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Indian+expats+GCC&hl=en&gl=AE&ceid=AE:en', name: 'Google News Diaspora', category: 'gcc', subcategory: 'diaspora', region: 'gcc', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=UAE+Dubai+news&hl=en&gl=AE&ceid=AE:en', name: 'Google News Gulf', category: 'gcc', subcategory: 'gulf', region: 'gcc', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Saudi+Arabia+news&hl=en&gl=SA&ceid=SA:en', name: 'Google News Saudi', category: 'gcc', subcategory: 'gulf', region: 'saudi', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Kuwait+news&hl=en&gl=KW&ceid=KW:en', name: 'Google News Kuwait', category: 'gcc', subcategory: 'gulf', region: 'kuwait', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Bahrain+news&hl=en&gl=BH&ceid=BH:en', name: 'Google News Bahrain', category: 'gcc', subcategory: 'gulf', region: 'bahrain', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Oman+news&hl=en&gl=OM&ceid=OM:en', name: 'Google News Oman', category: 'gcc', subcategory: 'gulf', region: 'oman', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:gulfnews.com&hl=en&gl=AE&ceid=AE:en', name: 'GN Gulf News', category: 'gcc', subcategory: 'gulf', region: 'uae', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:khaleejtimes.com&hl=en&gl=AE&ceid=AE:en', name: 'GN Khaleej Times', category: 'gcc', subcategory: 'gulf', region: 'uae', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=India+cricket&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Cricket', category: 'sports', subcategory: 'cricket', region: 'india', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=football+soccer&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Football', category: 'sports', subcategory: 'football', region: 'india', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Indian+stock+market+Sensex&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Markets', category: 'business', subcategory: 'markets', region: 'india', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=jobs+hiring+India&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Jobs', category: 'jobs', subcategory: 'jobs', region: 'india', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=personal+finance+India&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Personal Finance', category: 'business', subcategory: 'personal-finance', region: 'india', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=artificial+intelligence+AI&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News AI', category: 'technology', subcategory: 'ai-tech', region: 'global', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=ISRO+space+science&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Space', category: 'technology', subcategory: 'space-science', region: 'india', language: 'en', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=startup+funding+India&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News Startups', category: 'technology', subcategory: 'startups', region: 'india', language: 'en', type: 'googlenews' },
];

export const ALL_LEGACY_CATEGORIES = [
  'india', 'gcc', 'business', 'technology', 'sports', 'entertainment',
  'health', 'education', 'jobs', 'realestate', 'lifestyle', 'opinion', 'world',
];
