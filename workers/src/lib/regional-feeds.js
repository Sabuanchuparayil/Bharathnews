/** Regional RSS sources — verified 2026-06-12.
 *  OneIndia feeds need rss2json proxy (Cloudflare 403).
 *  Google News feeds use googlenews type (rss2json in rss-parser).
 */

export const REGIONAL_RSS_SOURCES = [
  // ── OneIndia (Greynium) — proxied via oneindia.com in rss-parser ──
  { url: 'https://malayalam.oneindia.com/rss/malayalam-news-fb.xml', name: 'OneIndia Malayalam', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://tamil.oneindia.com/rss/tamil-news-fb.xml', name: 'OneIndia Tamil', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://telugu.oneindia.com/rss/telugu-news-fb.xml', name: 'OneIndia Telugu', category: 'india', region: 'andhra', language: 'te', type: 'rss' },
  { url: 'https://kannada.oneindia.com/rss/kannada-news-fb.xml', name: 'OneIndia Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'rss' },
  { url: 'https://hindi.oneindia.com/rss/hindi-news-fb.xml', name: 'OneIndia Hindi', category: 'india', region: 'india', language: 'hi', type: 'rss' },

  // ── Google News regional (rss2json proxy) ──
  { url: 'https://news.google.com/rss?hl=ml-IN&gl=IN&ceid=IN:ml', name: 'Google News Malayalam', category: 'india', region: 'kerala', language: 'ml', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=ta-IN&gl=IN&ceid=IN:ta', name: 'Google News Tamil', category: 'india', region: 'tamilnadu', language: 'ta', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=te-IN&gl=IN&ceid=IN:te', name: 'Google News Telugu', category: 'india', region: 'andhra', language: 'te', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=kn-IN&gl=IN&ceid=IN:kn', name: 'Google News Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=hi-IN&gl=IN&ceid=IN:hi', name: 'Google News Hindi', category: 'india', region: 'india', language: 'hi', type: 'googlenews' },
  { url: 'https://news.google.com/rss?hl=bn-IN&gl=IN&ceid=IN:bn', name: 'Google News Bengali', category: 'india', region: 'westbengal', language: 'bn', type: 'googlenews' },

  // ── Malayalam publishers ──
  { url: 'https://www.twentyfournews.com/feed', name: 'Twentyfour News', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://www.janamtv.com/feed', name: 'Janam TV', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },
  { url: 'https://keralakaumudi.com/rss/news', name: 'Kerala Kaumudi', category: 'india', region: 'kerala', language: 'ml', type: 'rss' },

  // ── Tamil publishers ──
  { url: 'https://feeds.bbci.co.uk/tamil/rss.xml', name: 'BBC Tamil', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://www.thehindu.com/news/national/tamil-nadu/?service=rss', name: 'The Hindu Tamil Nadu', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://indianexpress.com/section/cities/chennai/feed/', name: 'IE Chennai', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },
  { url: 'https://www.vikatan.com/feed', name: 'Vikatan', category: 'india', region: 'tamilnadu', language: 'ta', type: 'rss' },

  // ── Telugu publishers ──
  { url: 'https://www.sakshi.com/rss.xml', name: 'Sakshi', category: 'india', region: 'andhra', language: 'te', type: 'rss' },
  { url: 'https://feeds.bbci.co.uk/telugu/rss.xml', name: 'BBC Telugu', category: 'india', region: 'andhra', language: 'te', type: 'rss' },
  { url: 'https://10tv.in/feed/', name: '10TV Telugu', category: 'india', region: 'telangana', language: 'te', type: 'rss' },

  // ── Kannada publishers ──
  { url: 'https://publictv.in/feed/', name: 'Public TV Kannada', category: 'india', region: 'karnataka', language: 'kn', type: 'rss' },

  // ── Hindi publishers ──
  { url: 'https://feeds.bbci.co.uk/hindi/rss.xml', name: 'BBC Hindi', category: 'india', region: 'india', language: 'hi', type: 'rss' },
  { url: 'https://www.amarujala.com/rss/breaking-news.xml', name: 'Amar Ujala', category: 'india', region: 'india', language: 'hi', type: 'rss' },

  // ── Bengali publishers ──
  { url: 'https://feeds.bbci.co.uk/bengali/rss.xml', name: 'BBC Bengali', category: 'india', region: 'westbengal', language: 'bn', type: 'rss' },
  { url: 'https://zeenews.india.com/bengali/rss.xml', name: 'Zee Bangla', category: 'india', region: 'westbengal', language: 'bn', type: 'rss' },
];

export const REGIONAL_LANGUAGES = ['ml', 'ta', 'te', 'kn', 'bn', 'hi'];
