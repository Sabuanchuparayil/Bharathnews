// All URLs verified to return items from the Cloudflare Worker network (2026-06-12).
// Indian Express feeds return 0 from datacenter IPs → replaced with TOI/HT/Hindu.
export const RSS_FEEDS = [
  // ── India ──
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', category: 'india', region: 'india' },
  { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu', category: 'india', region: 'india' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', name: 'Times of India', category: 'india', region: 'india' },
  { url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', name: 'Hindustan Times', category: 'india', region: 'india' },
  { url: 'https://www.livemint.com/rss/news', name: 'Livemint', category: 'india', region: 'india' },
  { url: 'https://www.thenewsminute.com/feed', name: 'The News Minute', category: 'india', region: 'kerala' },
  { url: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml', name: 'BBC India', category: 'india', region: 'india' },
  // ── GCC ──
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'gcc', region: 'qatar' },
  { url: 'https://saudigazette.com.sa/rssFeed/74', name: 'Saudi Gazette', category: 'gcc', region: 'saudi' },
  { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', category: 'gcc', region: 'saudi' },
  { url: 'https://dohanews.co/feed/', name: 'Doha News', category: 'gcc', region: 'qatar' },
  // ── Business ──
  { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', name: 'Economic Times', category: 'business', region: 'india' },
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', name: 'ET Markets', category: 'business', region: 'india' },
  { url: 'https://www.thehindu.com/business/feeder/default.rss', name: 'The Hindu Business', category: 'business', region: 'india' },
  // ── Technology ──
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'technology', region: 'global' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'technology', region: 'global' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms', name: 'TOI Tech', category: 'technology', region: 'india' },
  // ── Sports ──
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', name: 'ESPN Cricinfo', category: 'sports', region: 'india' },
  { url: 'https://www.thehindu.com/sport/feeder/default.rss', name: 'The Hindu Sports', category: 'sports', region: 'india' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', name: 'TOI Sports', category: 'sports', region: 'india' },
  // ── Entertainment ──
  { url: 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml', name: 'HT Entertainment', category: 'entertainment', region: 'india' },
  { url: 'https://www.thehindu.com/entertainment/feeder/default.rss', name: 'The Hindu Entertainment', category: 'entertainment', region: 'india' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms', name: 'TOI Entertainment', category: 'entertainment', region: 'india' },
  // ── Health ──
  { url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss', name: 'The Hindu Health', category: 'health', region: 'india' },
  // ── Education ──
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms', name: 'TOI Education', category: 'education', region: 'india' },
  { url: 'https://www.thehindu.com/education/feeder/default.rss', name: 'The Hindu Education', category: 'education', region: 'india' },
  // ── Jobs ──
  { url: 'https://economictimes.indiatimes.com/jobs/rssfeeds/13357270.cms', name: 'ET Jobs', category: 'jobs', region: 'india' },
  // ── Real Estate ──
  { url: 'https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/48997553.cms', name: 'ET Real Estate', category: 'realestate', region: 'india' },
  // ── Lifestyle ──
  { url: 'https://www.thehindu.com/life-and-style/feeder/default.rss', name: 'The Hindu Lifestyle', category: 'lifestyle', region: 'india' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/2886704.cms', name: 'TOI Lifestyle', category: 'lifestyle', region: 'india' },
  // ── Opinion ──
  { url: 'https://www.thehindu.com/opinion/feeder/default.rss', name: 'The Hindu Opinion', category: 'opinion', region: 'india' },
  // ── World ──
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'world', region: 'global' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', name: 'TOI World', category: 'world', region: 'india' },
];

// Channel IDs verified against live YouTube RSS feeds (2026-06-12).
export const YOUTUBE_CHANNELS = [
  // Malayalam
  { channelId: 'UCf8w5m0YsRa8MHQ5bwSGmbw', name: 'Asianet News', category: 'india', language: 'ml' },
  { channelId: 'UCP0uG-mcMImgKnJz-VjJZmQ', name: 'Manorama News', category: 'india', language: 'ml' },
  { channelId: 'UC-f7r46JhYv78q5pGrO6ivA', name: 'MediaOne', category: 'india', language: 'ml' },
  { channelId: 'UCwXrBBZnIh2ER4lal6WbAHw', name: 'Mathrubhumi News', category: 'india', language: 'ml' },
  { channelId: 'UCnEvxaWfVL91XIYuyQRO5QA', name: 'Kairali News', category: 'india', language: 'ml' },
  { channelId: 'UCFx1nseXKTc1Culiu3neeSQ', name: 'Reporter Live', category: 'india', language: 'ml' },
  { channelId: 'UC-mMi78WJST4N5o8_i1FoXw', name: 'News18 Kerala', category: 'india', language: 'ml' },
  { channelId: 'UCJY38d2Z82irYr00fki974A', name: '24 News Malayalam', category: 'india', language: 'ml' },
  { channelId: 'UCr-3D8M0HDg8VwQsNM-t3Tw', name: 'Raj News Malayalam', category: 'india', language: 'ml' },
  { channelId: 'UCfuZhbx-XjSqKya7dAiXTuw', name: 'Janam TV', category: 'india', language: 'ml' },
  { channelId: 'UCsVJ9ZxMjtSLqmZjjglL__g', name: 'Kerala Vision', category: 'india', language: 'ml' },
  { channelId: 'UCFcbm8WeZhQIy1sA50zJ3Jg', name: 'Jaihind TV', category: 'india', language: 'ml' },
  // Tamil
  { channelId: 'UCYlh4lH762HvHt6mmiecyWQ', name: 'Sun News', category: 'india', language: 'ta' },
  { channelId: 'UC8Z-VjXBtDJTvq6aqkIskPg', name: 'Polimer News', category: 'india', language: 'ta' },
  { channelId: 'UCmyKnNRH0wH-r8I-ceP-dsg', name: 'Puthiyathalaimurai', category: 'india', language: 'ta' },
  { channelId: 'UC2f4w_ppqHplvjiNaoTAK9w', name: 'News7 Tamil', category: 'india', language: 'ta' },
  { channelId: 'UCat88i6_rELqI_prwvjspRA', name: 'News18 Tamil Nadu', category: 'india', language: 'ta' },
  { channelId: 'UCno6OgN7-NDmRTNBgqWevlw', name: 'Captain News', category: 'india', language: 'ta' },
  { channelId: 'UCOP4Gbw-T1ofcW8vyL89ZDw', name: 'Jaya Plus', category: 'india', language: 'ta' },
  // Kannada
  { channelId: 'UC8dnBi4WUErqYQHZ4PfsLTg', name: 'TV9 Kannada', category: 'india', language: 'kn' },
  { channelId: 'UCK9eVqJG07tpuQEadDlnwJw', name: 'TV9 Kannada News', category: 'india', language: 'kn' },
  { channelId: 'UCa-vioGhe2btBcZneaPonKA', name: 'News18 Kannada', category: 'india', language: 'kn' },
  // Telugu
  { channelId: 'UCtzYV2L-m8ew93mZb3qhf5w', name: 'NTV Telugu', category: 'india', language: 'te' },
  { channelId: 'UC_2irx_BQR7RsBKmUV9fePQ', name: 'ABN Telugu', category: 'india', language: 'te' },
  { channelId: 'UCQ_FATLW83q-4xJ2fsi8qAw', name: 'Sakshi TV', category: 'india', language: 'te' },
  { channelId: 'UClMlGnpuMYDPKwpBufpjfMA', name: 'T News', category: 'india', language: 'te' },
  { channelId: 'UCRYQj7pRrjm8EwgsUMNVJsQ', name: 'iNews', category: 'india', language: 'te' },
  { channelId: 'UCixD-KrpjXtMupkzkdFFlFg', name: 'CVR News', category: 'india', language: 'te' },
  { channelId: 'UC61kgbrqggBKUD2nBb8f3Aw', name: 'Prime9 News', category: 'india', language: 'te' },
  // Bengali
  { channelId: 'UCbf0XHULBkTfv2hBjaaDw9Q', name: 'News18 Bangla', category: 'india', language: 'bn' },
  { channelId: 'UCNvCQpcafnbW4KQ8X7oQ9kg', name: 'Kolkata TV', category: 'india', language: 'bn' },
  { channelId: 'UCJ3I6MHOz5exARlTW_meOGQ', name: 'Calcutta News', category: 'india', language: 'bn' },
];

/** Primary site navigation — top-level sections. Category pages via Explore. */
export const HEADER_NAV = [
  { path: '/', label: 'Home' },
  { path: '/india', label: 'India' },
  { path: '/gcc', label: 'GCC' },
  { path: '/business', label: 'Business' },
  { path: '/explore', label: 'Explore' },
  { path: '/videos', label: 'Videos' },
];

export const CATEGORY_ROUTES = {
  india: { path: '/india', title: 'India News' },
  gcc: { path: '/gcc', title: 'GCC News' },
  business: { path: '/business', title: 'Business News' },
  technology: { path: '/technology', title: 'Technology News' },
  sports: { path: '/sports', title: 'Sports News' },
  entertainment: { path: '/entertainment', title: 'Entertainment News' },
  health: { path: '/health', title: 'Health & Wellness' },
  education: { path: '/education', title: 'Education News' },
  jobs: { path: '/jobs', title: 'Jobs & Careers' },
  realestate: { path: '/real-estate', title: 'Real Estate' },
  lifestyle: { path: '/lifestyle', title: 'Lifestyle & Travel' },
  opinion: { path: '/opinion', title: 'Opinion & Editorial' },
  world: { path: '/world', title: 'World News' },
};

export const getFeedForCategory = (category) => {
  const feed = RSS_FEEDS.find(f => f.category === category);
  return feed ? { url: feed.url, title: feed.name } : null;
};

export const getFeedsForCategory = (category) =>
  RSS_FEEDS.filter(f => f.category === category);

/** Primary categories shown on the home page filter (avoids clutter). Full list on Explore. */
export const HOME_CATEGORY_IDS = [
  'all', 'breaking', 'india', 'gcc', 'business', 'technology', 'sports', 'entertainment', 'health',
];

export const getHomeCategories = () =>
  CATEGORIES.filter(c => HOME_CATEGORY_IDS.includes(c.id));

export const CATEGORIES = [
  { id: 'all', name: 'All News', color: 'bg-gray-100 text-gray-700' },
  { id: 'breaking', name: 'Breaking', color: 'bg-red-100 text-red-700' },
  { id: 'india', name: 'India', color: 'bg-orange-100 text-orange-700' },
  { id: 'gcc', name: 'GCC', color: 'bg-green-100 text-green-700' },
  { id: 'business', name: 'Business', color: 'bg-blue-100 text-blue-700' },
  { id: 'technology', name: 'Technology', color: 'bg-purple-100 text-purple-700' },
  { id: 'sports', name: 'Sports', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'entertainment', name: 'Entertainment', color: 'bg-pink-100 text-pink-700' },
  { id: 'health', name: 'Health', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'education', name: 'Education', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'jobs', name: 'Jobs', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'realestate', name: 'Real Estate', color: 'bg-amber-100 text-amber-700' },
  { id: 'lifestyle', name: 'Lifestyle', color: 'bg-rose-100 text-rose-700' },
  { id: 'opinion', name: 'Opinion', color: 'bg-slate-100 text-slate-700' },
  { id: 'world', name: 'World', color: 'bg-violet-100 text-violet-700' },
];

export const CREATOR_CONTENT_TYPES = [
  { id: 'article', name: 'Article', description: 'News analysis, opinion, commentary' },
  { id: 'story', name: 'Story', description: 'Creative fiction and personal narratives' },
  { id: 'poem', name: 'Poem', description: 'Poetry in English or Malayalam' },
  { id: 'journal', name: 'Journal', description: 'Personal diary and blog entries' },
  { id: 'video', name: 'Video', description: 'YouTube or Instagram video links' },
];

export const CREATOR_ROLES = [
  { id: 'contributor', name: 'Citizen Journalist', description: 'Submit articles, stories, poems, and journals' },
  { id: 'vlogger', name: 'Community Vlogger', description: 'Share video content from YouTube or Instagram' },
];
