export const RSS_FEEDS = [
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', category: 'india', region: 'india' },
  { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu', category: 'india', region: 'india' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', name: 'Times of India', category: 'india', region: 'india' },
  { url: 'https://indianexpress.com/section/india/feed/', name: 'Indian Express', category: 'india', region: 'india' },
  { url: 'https://scroll.in/feed', name: 'Scroll.in', category: 'india', region: 'india' },
  { url: 'https://thewire.in/feed', name: 'The Wire', category: 'india', region: 'india' },
  { url: 'https://www.livemint.com/rss/news', name: 'Livemint', category: 'india', region: 'india' },
  { url: 'https://www.deccanherald.com/rss/india.rss', name: 'Deccan Herald', category: 'india', region: 'india' },
  { url: 'https://theprint.in/feed/', name: 'The Print', category: 'india', region: 'india' },
  { url: 'https://www.news18.com/rss/india.xml', name: 'News18', category: 'india', region: 'india' },
  { url: 'https://www.firstpost.com/rss/india.xml', name: 'Firstpost', category: 'india', region: 'india' },
  { url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', name: 'Hindustan Times', category: 'india', region: 'india' },
  { url: 'https://www.onmanorama.com/rss.xml', name: 'Onmanorama', category: 'india', region: 'kerala' },
  { url: 'https://www.thenewsminute.com/feed', name: 'The News Minute', category: 'india', region: 'kerala' },
  { url: 'https://gulfnews.com/rss', name: 'Gulf News', category: 'gcc', region: 'uae' },
  { url: 'https://www.khaleejtimes.com/rss', name: 'Khaleej Times', category: 'gcc', region: 'uae' },
  { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', category: 'gcc', region: 'saudi' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'gcc', region: 'qatar' },
  { url: 'https://www.thenationalnews.com/rss', name: 'The National', category: 'gcc', region: 'uae' },
  { url: 'https://www.gulftoday.ae/rss', name: 'Gulf Today', category: 'gcc', region: 'uae' },
  { url: 'https://gulfbusiness.com/feed', name: 'Gulf Business', category: 'business', region: 'gcc' },
  { url: 'https://economictimes.indiatimes.com/rss.cms', name: 'Economic Times', category: 'business', region: 'india' },
  { url: 'https://www.business-standard.com/rss', name: 'Business Standard', category: 'business', region: 'india' },
  { url: 'https://www.financialexpress.com/feed/', name: 'Financial Express', category: 'business', region: 'india' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'technology', region: 'global' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'technology', region: 'global' },
  { url: 'https://yourstory.com/feed', name: 'YourStory', category: 'technology', region: 'india' },
  { url: 'https://inc42.com/feed/', name: 'Inc42', category: 'technology', region: 'india' },
  { url: 'https://news.google.com/rss/search?q=Indian+expats+GCC&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News - India GCC', category: 'gcc', region: 'gcc' },
  { url: 'https://news.google.com/rss/search?q=Kerala+news&hl=en-IN&gl=IN&ceid=IN:en', name: 'Google News - Kerala', category: 'india', region: 'kerala' },
  { url: 'https://news.google.com/rss/search?q=Dubai+India+business&hl=en&gl=AE&ceid=AE:en', name: 'Google News - Dubai India', category: 'business', region: 'gcc' },
  // Sports
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', name: 'ESPN Cricinfo', category: 'sports', region: 'india' },
  { url: 'https://www.thehindu.com/sport/feeder/default.rss', name: 'The Hindu Sports', category: 'sports', region: 'india' },
  { url: 'https://www.khaleejtimes.com/rss/sports', name: 'Khaleej Times Sports', category: 'sports', region: 'gcc' },
  { url: 'https://gulfnews.com/sport/rss', name: 'Gulf News Sport', category: 'sports', region: 'gcc' },
  // Entertainment
  { url: 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml', name: 'HT Entertainment', category: 'entertainment', region: 'india' },
  { url: 'https://www.thehindu.com/entertainment/feeder/default.rss', name: 'The Hindu Entertainment', category: 'entertainment', region: 'india' },
  { url: 'https://indianexpress.com/section/entertainment/feed/', name: 'IE Entertainment', category: 'entertainment', region: 'india' },
  { url: 'https://gulfnews.com/entertainment/rss', name: 'Gulf News Entertainment', category: 'entertainment', region: 'gcc' },
  // Health
  { url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss', name: 'The Hindu Health', category: 'health', region: 'india' },
  { url: 'https://indianexpress.com/section/lifestyle/health-wellness/feed/', name: 'IE Health', category: 'health', region: 'india' },
  { url: 'https://gulfnews.com/lifestyle/health/rss', name: 'Gulf News Health', category: 'health', region: 'gcc' },
  // Education
  { url: 'https://www.ndtv.com/education/rss', name: 'NDTV Education', category: 'education', region: 'india' },
  { url: 'https://indianexpress.com/section/education/feed/', name: 'IE Education', category: 'education', region: 'india' },
  { url: 'https://gulfnews.com/uae/education/rss', name: 'Gulf News Education', category: 'education', region: 'gcc' },
  // Jobs
  { url: 'https://economictimes.indiatimes.com/jobs/rssfeeds/13357270.cms', name: 'ET Jobs', category: 'jobs', region: 'india' },
  { url: 'https://gulfnews.com/uae/jobs/rss', name: 'Gulf News Jobs', category: 'jobs', region: 'gcc' },
  { url: 'https://www.khaleejtimes.com/rss/jobs', name: 'Khaleej Times Jobs', category: 'jobs', region: 'gcc' },
  // Real Estate
  { url: 'https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/48997553.cms', name: 'ET Real Estate', category: 'realestate', region: 'india' },
  { url: 'https://gulfnews.com/business/property/rss', name: 'Gulf News Property', category: 'realestate', region: 'gcc' },
  // Lifestyle
  { url: 'https://www.thehindu.com/life-and-style/feeder/default.rss', name: 'The Hindu Lifestyle', category: 'lifestyle', region: 'india' },
  { url: 'https://gulfnews.com/lifestyle/rss', name: 'Gulf News Lifestyle', category: 'lifestyle', region: 'gcc' },
  { url: 'https://indianexpress.com/section/lifestyle/feed/', name: 'IE Lifestyle', category: 'lifestyle', region: 'india' },
  // Opinion
  { url: 'https://indianexpress.com/section/opinion/feed/', name: 'IE Opinion', category: 'opinion', region: 'india' },
  { url: 'https://www.thehindu.com/opinion/feeder/default.rss', name: 'The Hindu Opinion', category: 'opinion', region: 'india' },
  { url: 'https://scroll.in/feed', name: 'Scroll Opinion', category: 'opinion', region: 'india' },
];

export const YOUTUBE_CHANNELS = [
  { channelId: 'UCZFMRhFE8wT_a3dWG6jA-w', name: 'NDTV', category: 'india' },
  { channelId: 'UCn_sFHSIJuezVFRIVoGzfAg', name: 'Asianet News', category: 'india' },
  { channelId: 'UCP0uG-mcMImgKnJz-VjVZkQ', name: 'Manorama News', category: 'india' },
  { channelId: 'UC4GNaC2DXBHY8tGikK3bqIw', name: 'Gulf News', category: 'gcc' },
  { channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', name: 'Al Jazeera English', category: 'gcc' },
  { channelId: 'UC7fWeaHhqgM4Lba7wehMhKw', name: 'TRT World', category: 'gcc' },
  { channelId: 'UC_gUM8rL-Lrg6O3adPW9K1g', name: 'WION', category: 'india' },
  { channelId: 'UCwouKE4bKDRetlX0YRFYkCQ', name: 'Republic TV', category: 'india' },
];

/** Primary site navigation — sections only, no category duplicates. */
export const HEADER_NAV = [
  { path: '/', label: 'Home' },
  { path: '/explore', label: 'Explore' },
  { path: '/videos', label: 'Videos' },
  { path: '/community', label: 'Community' },
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
