/** Regional RSS sources — verified 2026-06-25.
 *  OneIndia feeds need rss2json proxy (Cloudflare 403).
 *  Google News feeds use googlenews type (rss2json in rss-parser).
 */

/** Malayalam feeds verified working — used first for ml ingest (Facebook/dlvr.it). */
export const MALAYALAM_RSS_SOURCES = [
  { url: 'https://malayalam.oneindia.com/rss/malayalam-news-fb.xml', name: 'OneIndia Malayalam', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://news.google.com/rss/search?q=Kerala+news&hl=ml-IN&gl=IN&ceid=IN:ml', name: 'GN Kerala News', category: 'india', region: 'kerala', language: 'ml', type: 'googlenews' },
  { url: 'https://newsable.asianetnews.com/rss', name: 'Asianet Newsable', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
];

/** Feeds that fail from Workers (403/500/empty) — excluded from ml rotation. */
export const DISABLED_ML_FEED_URLS = new Set([
  'https://news.google.com/rss?hl=ml-IN&gl=IN&ceid=IN:ml',
  'https://www.twentyfournews.com/feed',
  'https://keralakaumudi.com/rss/news',
]);

export const REGIONAL_RSS_SOURCES = [
  // ── OneIndia (Greynium) — proxied via rss2json ──
  ...MALAYALAM_RSS_SOURCES,
  { url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml', name: 'OneIndia Tamil', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://telugu.oneindia.com/rss/telugu-news-fb.xml', name: 'OneIndia Telugu', category: 'india', region: 'andhra', language: 'te', type: 'rss' },
  { url: 'https://kannada.oneindia.com/rss/kannada-news-fb.xml', name: 'OneIndia Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'rss' },
  { url: 'https://hindi.oneindia.com/rss/hindi-news-fb.xml', name: 'OneIndia Hindi', category: 'india', region: 'india', language: 'hi', type: 'rss' },

  // ── Google News regional (rss2json proxy) ──
  { url: 'https://news.google.com/rss?hl=ta-IN&gl=IN&ceid=IN:ta', name: 'Google News Tamil', category: 'india', region: 'tamilnadu', language: 'ta', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=te-IN&gl=IN&ceid=IN:te', name: 'Google News Telugu', category: 'india', region: 'andhra', language: 'te', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=kn-IN&gl=IN&ceid=IN:kn', name: 'Google News Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=hi-IN&gl=IN&ceid=IN:hi', name: 'Google News Hindi', category: 'india', region: 'india', language: 'hi', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=bn-IN&gl=IN&ceid=IN:bn', name: 'Google News Bengali', category: 'india', region: 'westbengal', language: 'bn', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=ur&gl=IN&ceid=IN:ur', name: 'Google News Urdu', category: 'india', region: 'india', language: 'ur', type: 'googlenews' },

  // ── Google News topic searches (regional) ──
  { url: 'https://news.google.com/rss/search?q=Karnataka+news&hl=kn-IN&gl=IN&ceid=IN:kn', name: 'GN Karnataka News', category: 'india', region: 'karnataka', language: 'kn', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Bengaluru+news&hl=kn-IN&gl=IN&ceid=IN:kn', name: 'GN Bengaluru Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=West+Bengal+news&hl=bn-IN&gl=IN&ceid=IN:bn', name: 'GN Bengal News', category: 'india', region: 'westbengal', language: 'bn', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Kolkata+news&hl=bn-IN&gl=IN&ceid=IN:bn', name: 'GN Kolkata Bengali', category: 'india', region: 'westbengal', language: 'bn', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Hyderabad+Urdu+news&hl=ur&gl=IN&ceid=IN:ur', name: 'GN Hyderabad Urdu', category: 'india', region: 'india', language: 'ur', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=India+Urdu+news&hl=ur&gl=IN&ceid=IN:ur', name: 'GN India Urdu', category: 'india', region: 'india', language: 'ur', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Tamil+Nadu+news&hl=ta-IN&gl=IN&ceid=IN:ta', name: 'GN Tamil Nadu', category: 'india', region: 'tamilnadu', language: 'ta', type: 'googlenews' },
  { url: 'https://news.google.com/rss/search?q=Andhra+Pradesh+Telangana+news&hl=te-IN&gl=IN&ceid=IN:te', name: 'GN AP Telangana', category: 'india', region: 'andhra', language: 'te', type: 'googlenews' },

  // ── Tamil publishers ──
  { url: 'https://feeds.bbci.co.uk/tamil/rss.xml', name: 'BBC Tamil', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://www.thehindu.com/news/national/tamil-nadu/?service=rss', name: 'The Hindu Tamil Nadu', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://indianexpress.com/section/cities/chennai/feed/', name: 'IE Chennai', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://www.vikatan.com/feed', name: 'Vikatan', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://kumudam.com/rss/latest-posts', name: 'Kumudam', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },

  // ── Telugu publishers ──
  { url: 'https://www.sakshi.com/rss.xml', name: 'Sakshi', category: 'india', region: 'andhra', language: 'te', type: 'rss' },
  { url: 'https://feeds.bbci.co.uk/telugu/rss.xml', name: 'BBC Telugu', category: 'india', region: 'andhra', language: 'te', type: 'rss' },
  { url: 'https://10tv.in/feed/', name: '10TV Telugu', category: 'india', region: 'telangana', language: 'te', type: 'rss' },
  { url: 'https://www.andhrajyothy.com/rss/feed.xml', name: 'Andhra Jyothy', category: 'india', region: 'andhra', language: 'te', type: 'rss' },

  // ── Kannada publishers ──
  { url: 'https://publictv.in/feed/', name: 'Public TV Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'rss' },
  { url: 'https://www.prajavani.net/feed', name: 'Prajavani', category: 'india', region: 'karnataka', language: 'kn', type: 'rss' },

  // ── Hindi publishers ──
  { url: 'https://feeds.bbci.co.uk/hindi/rss.xml', name: 'BBC Hindi', category: 'india', region: 'india', language: 'hi', type: 'rss' },
  { url: 'https://www.amarujala.com/rss/breaking-news.xml', name: 'Amar Ujala', category: 'india', region: 'india', language: 'hi', type: 'rss' },
  { url: 'https://bhaskar.com/rss-v1--category-1061.xml', name: 'Dainik Bhaskar National', category: 'india', region: 'india', language: 'hi', type: 'rss' },
  { url: 'https://bhaskar.com/rss-v1--category-1125.xml', name: 'Dainik Bhaskar World', category: 'world', region: 'india', language: 'hi', type: 'rss' },
  { url: 'https://bhaskar.com/rss-v1--category-1051.xml', name: 'Dainik Bhaskar Business', category: 'business', region: 'india', language: 'hi', type: 'rss' },

  // ── Bengali publishers ──
  { url: 'https://feeds.bbci.co.uk/bengali/rss.xml', name: 'BBC Bengali', category: 'india', region: 'westbengal', language: 'bn', type: 'rss' },
  { url: 'https://zeenews.india.com/bengali/rss.xml', name: 'Zee Bangla', category: 'india', region: 'westbengal', language: 'bn', type: 'rss' },
  { url: 'https://bengali.abplive.com/news/feed', name: 'ABP Ananda', category: 'india', region: 'westbengal', language: 'bn', type: 'rss' },

  // ── Urdu publishers ──
  { url: 'https://feeds.bbci.co.uk/urdu/rss.xml', name: 'BBC Urdu', category: 'india', region: 'india', language: 'ur', type: 'rss' },
  { url: 'https://www.etemaaddaily.com/rss/all-news', name: 'Etemaad Urdu', category: 'india', region: 'india', language: 'ur', type: 'rss' },
  { url: 'https://urdu.siasat.com/feed/', name: 'Siasat Daily Urdu', category: 'india', region: 'india', language: 'ur', type: 'rss' },
];

export const REGIONAL_LANGUAGES = ['ml', 'ta', 'te', 'kn', 'bn', 'hi', 'ur'];
