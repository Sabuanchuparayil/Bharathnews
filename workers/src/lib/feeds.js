/** Fallback feeds when Supabase sources collection is empty */

import { REGIONAL_RSS_SOURCES } from './regional-feeds.js';
import { RSS_FEEDS as CORE_RSS_FEEDS, GOOGLE_NEWS_TOPIC_FEEDS } from '../../../shared/rss-feeds.mjs';

export const FALLBACK_RSS_FEEDS = [
  ...CORE_RSS_FEEDS,
  ...GOOGLE_NEWS_TOPIC_FEEDS.map(({ type, ...feed }) => feed),
  ...REGIONAL_RSS_SOURCES.map(({ type, ...feed }) => feed),
];

/** Bootstrap only. Used when the sources table has no enabled YouTube channels. */
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
  { channelId: 'UCsVJ9ZxMjtSLqmZjjglL__g', name: 'Kerala Vision', category: 'india', language: 'ml' },
  { channelId: 'UCFcbm8WeZhQIy1sA50zJ3Jg', name: 'Jaihind TV', category: 'india', language: 'ml' },
];

/** @deprecated Use loadEnabledSources from sources-loader.js */
export const RSS_FEEDS = FALLBACK_RSS_FEEDS;
export const YOUTUBE_CHANNELS = FALLBACK_YOUTUBE_CHANNELS;

export { GOOGLE_NEWS_TOPIC_FEEDS } from '../../../shared/rss-feeds.mjs';
