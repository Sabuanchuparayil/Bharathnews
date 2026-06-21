/** Shared site settings schema — used by admin UI, frontend context, and workers. */

export const DEFAULT_SITE_SETTINGS = {
  qualityThreshold: 6,
  targetLanguages: ['ml', 'hi', 'ta', 'te', 'kn', 'bn'],
  siteName: 'The Bharath News',
  tagline: 'Breaking news from India and GCC regions',
  headerText: 'The Bharath News',
  footerText: 'India-GCC News for the Global Indian',
  integrations: {
    telegram: {
      enabled: true,
      channelId: '@TheBharathNews',
      channelUrl: 'https://t.me/TheBharathNews',
      minScoreToPost: 7,
    },
    whatsapp: {
      enabled: true,
      channelUrl: '',
      showFollowCta: true,
    },
    email: {
      enabled: true,
      newsletterFrom: 'The Bharath News <news@thebharathnews.com>',
      digestEnabled: true,
      digestSubject: 'Your Weekly Digest — The Bharath News',
    },
    facebook: {
      enabled: true,
      pageUrl: 'https://facebook.com/TheBharathNewsIndia',
      minScoreToPost: 7,
      graphApiEnabled: false,
      dlvrItFeedUrl: 'https://www.thebharathnews.com/feed.xml?lang=ml&limit=25&hours=24',
      dlvrItEnglishFeedUrl: 'https://www.thebharathnews.com/feed.xml?lang=en&limit=25&hours=24',
      dlvrItMalayalamFeedUrl: 'https://www.thebharathnews.com/feed.xml?lang=ml&limit=25&hours=24',
      dlvrItEnglishFeedAlias: 'https://www.thebharathnews.com/feed/social-en.xml',
      dlvrItMalayalamFeedAlias: 'https://www.thebharathnews.com/feed/social-ml.xml',
      dlvrItMaxPostsPerDay: 25,
      postLanguage: 'ml',
      catchupBatchSize: 1,
    },
    youtube: {
      enabled: true,
      channelUrl: 'https://youtube.com/@TheBharathNews',
    },
    instagram: {
      enabled: true,
      profileUrl: 'https://instagram.com/thebharathnews',
    },
  },
  pipeline: {
    rssIngestEnabled: true,
    videoFetchEnabled: true,
  },
};

export function parseTargetLanguages(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return DEFAULT_SITE_SETTINGS.targetLanguages;
}

function deepMerge(base, patch) {
  const out = { ...base };
  for (const [key, val] of Object.entries(patch || {})) {
    if (val && typeof val === 'object' && !Array.isArray(val) && base[key] && typeof base[key] === 'object') {
      out[key] = deepMerge(base[key], val);
    } else if (val !== undefined) {
      out[key] = val;
    }
  }
  return out;
}

export function mergeSiteSettings(partial = {}) {
  const merged = deepMerge(DEFAULT_SITE_SETTINGS, partial);
  merged.targetLanguages = parseTargetLanguages(merged.targetLanguages);
  return merged;
}

export function buildSocialChannels(settings) {
  const s = mergeSiteSettings(settings);
  const { integrations: i } = s;
  const channels = {};

  if (i.telegram?.enabled !== false && i.telegram?.channelUrl) {
    channels.telegram = { name: 'Telegram', url: i.telegram.channelUrl, icon: 'Send' };
  }
  if (i.whatsapp?.enabled !== false && i.whatsapp?.channelUrl) {
    channels.whatsapp = { name: 'WhatsApp Channel', url: i.whatsapp.channelUrl, icon: 'MessageCircle' };
  }
  if (i.youtube?.enabled !== false && i.youtube?.channelUrl) {
    channels.youtube = { name: 'YouTube', url: i.youtube.channelUrl, icon: 'Youtube' };
  }
  if (i.instagram?.enabled !== false && i.instagram?.profileUrl) {
    channels.instagram = { name: 'Instagram', url: i.instagram.profileUrl, icon: 'Instagram' };
  }
  if (i.facebook?.enabled !== false && i.facebook?.pageUrl) {
    channels.facebook = { name: 'Facebook', url: i.facebook.pageUrl, icon: 'Facebook' };
  }

  return channels;
}

export function getWhatsAppChannelUrl(settings) {
  const url = mergeSiteSettings(settings).integrations?.whatsapp?.channelUrl;
  if (url) return url;
  if (typeof process !== 'undefined') {
    return process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || '';
  }
  return '';
}

export function getTelegramChannelId(settings) {
  return mergeSiteSettings(settings).integrations?.telegram?.channelId || '@TheBharathNews';
}
