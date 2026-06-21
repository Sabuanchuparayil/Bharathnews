// RSS feed registry — see shared/rss-feeds.mjs for canonical list with subcategory tags
import { RSS_FEEDS, GOOGLE_NEWS_TOPIC_FEEDS } from '../../shared/rss-feeds.mjs';

export { RSS_FEEDS, GOOGLE_NEWS_TOPIC_FEEDS };

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

export {
  HEADER_NAV,
  BOTTOM_NAV,
  CATEGORY_ROUTES,
  SECTION_ROUTES,
  SECTIONS,
  SUBCATEGORIES,
  CATEGORIES,
  HOME_CATEGORY_IDS,
  HOME_SECTION_IDS,
  LEGACY_TO_SECTION,
  LEGACY_TO_SUBCATEGORY,
  getSection,
  getSectionForPath,
  getSectionForLegacyCategory,
  getLegacyCategoriesForSection,
  getSubcategoriesForSection,
  getHomeCategories,
  resolveLegacyCategory,
} from './category-taxonomy.js';

export const getFeedForCategory = (category) => {
  const feed = RSS_FEEDS.find(f => f.category === category);
  return feed ? { url: feed.url, title: feed.name } : null;
};

export const getFeedsForCategory = (category) =>
  RSS_FEEDS.filter(f => f.category === category);


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
