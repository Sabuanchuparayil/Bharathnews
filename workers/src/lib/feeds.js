/** Fallback feeds when Firestore sources collection is empty */

import { REGIONAL_RSS_SOURCES } from './regional-feeds.js';

export const FALLBACK_RSS_FEEDS = [
  // India (English)
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', category: 'india', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu', category: 'india', region: 'india', language: 'en' },
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', name: 'Times of India', category: 'india', region: 'india', language: 'en' },
  // GCC
  { url: 'https://saudigazette.com.sa/rssFeed/74', name: 'Saudi Gazette', category: 'gcc', region: 'saudi', language: 'en' },
  { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', category: 'gcc', region: 'saudi', language: 'en' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'gcc', region: 'qatar', language: 'en' },
  // Regional language feeds (ml, ta, te, kn, hi, bn)
  ...REGIONAL_RSS_SOURCES.map(({ type, ...feed }) => feed),
  // World
  { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'world', region: 'global', language: 'en' },
  // Business
  { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', name: 'Economic Times', category: 'business', region: 'india', language: 'en' },
  // Technology
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'technology', region: 'global', language: 'en' },
  // Sports
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', name: 'ESPN Cricinfo', category: 'sports', region: 'india', language: 'en' },
  // Entertainment
  { url: 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml', name: 'HT Entertainment', category: 'entertainment', region: 'india', language: 'en' },
  // Health
  { url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss', name: 'The Hindu Health', category: 'health', region: 'india', language: 'en' },
  // Education
  { url: 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms', name: 'TOI Education', category: 'education', region: 'india', language: 'en' },
  // Jobs
  { url: 'https://economictimes.indiatimes.com/jobs/rssfeeds/13357270.cms', name: 'ET Jobs', category: 'jobs', region: 'india', language: 'en' },
  // Real Estate
  { url: 'https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/48997553.cms', name: 'ET Real Estate', category: 'realestate', region: 'india', language: 'en' },
  // Lifestyle
  { url: 'https://www.thehindu.com/life-and-style/feeder/default.rss', name: 'The Hindu Lifestyle', category: 'lifestyle', region: 'india', language: 'en' },
  // Opinion
  { url: 'https://www.thehindu.com/opinion/feeder/default.rss', name: 'The Hindu Opinion', category: 'opinion', region: 'india', language: 'en' },
];

export const FALLBACK_YOUTUBE_CHANNELS = [
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
  { channelId: 'UCYlh4lH762HvHt6mmiecyWQ', name: 'Sun News', category: 'india', language: 'ta' },
  { channelId: 'UC8Z-VjXBtDJTvq6aqkIskPg', name: 'Polimer News', category: 'india', language: 'ta' },
  { channelId: 'UCmyKnNRH0wH-r8I-ceP-dsg', name: 'Puthiyathalaimurai', category: 'india', language: 'ta' },
  { channelId: 'UC2f4w_ppqHplvjiNaoTAK9w', name: 'News7 Tamil', category: 'india', language: 'ta' },
  { channelId: 'UCat88i6_rELqI_prwvjspRA', name: 'News18 Tamil Nadu', category: 'india', language: 'ta' },
  { channelId: 'UCno6OgN7-NDmRTNBgqWevlw', name: 'Captain News', category: 'india', language: 'ta' },
  { channelId: 'UCOP4Gbw-T1ofcW8vyL89ZDw', name: 'Jaya Plus', category: 'india', language: 'ta' },
  { channelId: 'UC8dnBi4WUErqYQHZ4PfsLTg', name: 'TV9 Kannada', category: 'india', language: 'kn' },
  { channelId: 'UCK9eVqJG07tpuQEadDlnwJw', name: 'TV9 Kannada News', category: 'india', language: 'kn' },
  { channelId: 'UCa-vioGhe2btBcZneaPonKA', name: 'News18 Kannada', category: 'india', language: 'kn' },
  { channelId: 'UCtzYV2L-m8ew93mZb3qhf5w', name: 'NTV Telugu', category: 'india', language: 'te' },
  { channelId: 'UC_2irx_BQR7RsBKmUV9fePQ', name: 'ABN Telugu', category: 'india', language: 'te' },
  { channelId: 'UCQ_FATLW83q-4xJ2fsi8qAw', name: 'Sakshi TV', category: 'india', language: 'te' },
  { channelId: 'UClMlGnpuMYDPKwpBufpjfMA', name: 'T News', category: 'india', language: 'te' },
  { channelId: 'UCRYQj7pRrjm8EwgsUMNVJsQ', name: 'iNews', category: 'india', language: 'te' },
  { channelId: 'UCixD-KrpjXtMupkzkdFFlFg', name: 'CVR News', category: 'india', language: 'te' },
  { channelId: 'UC61kgbrqggBKUD2nBb8f3Aw', name: 'Prime9 News', category: 'india', language: 'te' },
  { channelId: 'UCbf0XHULBkTfv2hBjaaDw9Q', name: 'News18 Bangla', category: 'india', language: 'bn' },
  { channelId: 'UCNvCQpcafnbW4KQ8X7oQ9kg', name: 'Kolkata TV', category: 'india', language: 'bn' },
  { channelId: 'UCJ3I6MHOz5exARlTW_meOGQ', name: 'Calcutta News', category: 'india', language: 'bn' },
];

/** @deprecated Use loadEnabledSources from sources-loader.js */
export const RSS_FEEDS = FALLBACK_RSS_FEEDS;
export const YOUTUBE_CHANNELS = FALLBACK_YOUTUBE_CHANNELS;
