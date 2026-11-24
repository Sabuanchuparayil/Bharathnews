/** Malayalam RSS — the only regional language this site publishes. */

function mlSearch(name, query, category, subcategory) {
  return {
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ml&gl=IN&ceid=IN:ml`,
    name,
    category,
    subcategory,
    region: 'kerala',
    language: 'ml',
    type: 'googlenews',
  };
}

/** Malayalam feeds verified working — used first for ml ingest. */
export const MALAYALAM_RSS_SOURCES = [
  { url: 'https://www.asianetnews.com/rss', name: 'Asianet News Malayalam', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://feeds.feedburner.com/Mathrubhumi', name: 'Mathrubhumi', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://www.mediaoneonline.com/google_feeds.xml', name: 'Media One', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://www.suprabhaatham.com/feed', name: 'Suprabhaatham', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://www.twentyfournews.com/feed', name: 'Twentyfour News', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://news.google.com/rss/search?q=site:manoramaonline.com&hl=ml&gl=IN&ceid=IN:ml', name: 'Malayala Manorama (GN)', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=site:madhyamam.com&hl=ml&gl=IN&ceid=IN:ml', name: 'Madhyamam (GN)', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'googlenews' },
  { url: 'https://malayalam.oneindia.com/rss/malayalam-news-fb.xml', name: 'OneIndia Malayalam', category: 'india', subcategory: 'india', region: 'kerala', language: 'ml', type: 'rss' },
];

/** Section searches so Malayalam stories land on the same menus as English. */
export const MALAYALAM_TOPIC_FEEDS = [
  mlSearch('GN Malayalam Cricket', 'ക്രിക്കറ്റ് OR IPL', 'sports', 'cricket'),
  mlSearch('GN Malayalam Football', 'ഫുട്ബോൾ OR ഫിഫ', 'sports', 'football'),
  mlSearch('GN Malayalam Formula 1', 'ഫോർമുല വൺ OR Formula 1', 'sports', 'motorsport'),
  mlSearch('GN Malayalam Olympics', 'ഒളിമ്പിക്സ്', 'sports', 'olympics'),
  mlSearch('GN Malayalam Markets', 'സെൻസെക്സ് OR നിഫ്റ്റി OR ഓഹരി', 'business', 'markets'),
  mlSearch('GN Malayalam Jobs', 'തൊഴിൽ ഒഴിവ് OR നിയമനം', 'jobs', 'jobs'),
  mlSearch('GN Malayalam Personal Finance', 'ആദായനികുതി OR മ്യൂച്വൽ ഫണ്ട്', 'business', 'personal-finance'),
  mlSearch('GN Malayalam Health', 'ആരോഗ്യം', 'health', 'health'),
  mlSearch('GN Malayalam Education', 'വിദ്യാഭ്യാസം OR പരീക്ഷാ ഫലം', 'education', 'education'),
  mlSearch('GN Malayalam Cinema', 'മലയാളം സിനിമ', 'entertainment', 'entertainment'),
  mlSearch('GN Malayalam Gulf', 'ഗൾഫ് വാർത്ത OR ദുബായ് OR യുഎഇ', 'gcc', 'gulf'),
  mlSearch('GN Malayalam Pravasi', 'പ്രവാസി', 'gcc', 'diaspora'),
  mlSearch('GN Malayalam Space', 'ഐഎസ്ആർഒ OR ചന്ദ്രയാൻ', 'technology', 'space-science'),
  mlSearch('GN Malayalam Gadgets', 'സ്മാർട്ട്ഫോൺ', 'technology', 'gadgets'),
  mlSearch('GN Malayalam Startups', 'സ്റ്റാർട്ടപ്പ്', 'technology', 'startups'),
];

/** Feeds that fail from Workers or serve the wrong language. Janam TV and Republic are blocked separately. */
export const DISABLED_ML_FEED_URLS = new Set([
  'https://news.google.com/rss?hl=ml-IN&gl=IN&ceid=IN:ml',
  'https://news.google.com/rss/search?q=Kerala+news&hl=ml-IN&gl=IN&ceid=IN:ml',
  'https://keralakaumudi.com/rss/news',
  'https://www.keralakaumudi.com/ml/feed',
  'https://newsable.asianetnews.com/rss',
]);

export const REGIONAL_RSS_SOURCES = [
  ...MALAYALAM_RSS_SOURCES,
  ...MALAYALAM_TOPIC_FEEDS,
];

export const REGIONAL_LANGUAGES = ['ml'];
