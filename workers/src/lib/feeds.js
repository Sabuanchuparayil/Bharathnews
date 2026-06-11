/** Fallback feeds when Firestore sources collection is empty */

export const FALLBACK_RSS_FEEDS = [
  { url: 'https://feeds.feedburner.com/ndtvnews-top-stories', name: 'NDTV', category: 'india', region: 'india', language: 'en' },
  { url: 'https://www.thehindu.com/news/national/?service=rss', name: 'The Hindu', category: 'india', region: 'india', language: 'en' },
  { url: 'https://www.arabnews.com/rss.xml', name: 'Arab News', category: 'gcc', region: 'saudi', language: 'en' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'gcc', region: 'qatar', language: 'en' },
  { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'world', region: 'global', language: 'en' },
];

export const FALLBACK_YOUTUBE_CHANNELS = [
  { channelId: 'UCef1-8eOpJgud7BB6sDkibg', name: 'NDTV', category: 'india', language: 'en' },
  { channelId: 'UCIvaYmXn910QMdemBG3v1pQ', name: 'Al Jazeera English', category: 'gcc', language: 'en' },
];

/** @deprecated Use loadEnabledSources from sources-loader.js */
export const RSS_FEEDS = FALLBACK_RSS_FEEDS;
export const YOUTUBE_CHANNELS = FALLBACK_YOUTUBE_CHANNELS;
