/** Fallback feeds when Supabase sources collection is empty */

import { REGIONAL_RSS_SOURCES } from './regional-feeds.js';
import { RSS_FEEDS as CORE_RSS_FEEDS, GOOGLE_NEWS_TOPIC_FEEDS } from '../../../shared/rss-feeds.mjs';

export const FALLBACK_RSS_FEEDS = [
  ...CORE_RSS_FEEDS,
  ...GOOGLE_NEWS_TOPIC_FEEDS.map(({ type, ...feed }) => feed),
  ...REGIONAL_RSS_SOURCES.map(({ type, ...feed }) => feed),
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

export { GOOGLE_NEWS_TOPIC_FEEDS } from '../../../shared/rss-feeds.mjs';
