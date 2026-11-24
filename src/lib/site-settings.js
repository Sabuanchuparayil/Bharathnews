/** Shared site settings schema — used by admin UI, frontend context, and workers. */

export const DEFAULT_SITE_SETTINGS = {
  qualityThreshold: 6,
  targetLanguages: ['ml'],
  siteName: 'The Bharath News',
  tagline: 'Your window to India from the Gulf',
  headerText: 'The Bharath News',
  footerText: 'Your window to India from the Gulf',
  searchSuggestions: ['India GCC Trade', 'Dubai Jobs', 'Kerala Floods', 'Tech Layoffs', 'Cricket'],
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
      dlvrItFeedUrl: 'https://www.thebharathnews.com/feed/social-ml.xml',
      dlvrItEnglishFeedUrl: 'https://www.thebharathnews.com/feed/social-en.xml',
      dlvrItEnglishFeedAlias: 'https://www.thebharathnews.com/feed/social-en.xml',
      dlvrItMalayalamFeedUrl: 'https://www.thebharathnews.com/feed/social-ml.xml',
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
  newsroom: {
    editorialSource: 'Bharath News Editorial',
    communitySource: 'Bharath News Community',
    languages: [
      { code: 'en', label: 'English' },
      { code: 'ml', label: 'Malayalam' },
    ],
    sourceTypes: ['rss', 'googlenews', 'youtube'],
    defaultCategory: 'india',
    defaultTrustWeight: 0.85,
    coworkStaleHours: 6,
    reviewPageSize: 40,
    distribution: { telegram: 3, facebook: 2, backfillLimit: 40 },
    chartColors: ['#0D7377', '#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6', '#6366f1', '#ec4899'],
  },
};

const PUBLICATION_LANGUAGE_CODES = new Set(['en', 'ml']);

export function parseTargetLanguages(value) {
  const raw = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split(',') : DEFAULT_SITE_SETTINGS.targetLanguages);
  const codes = [...new Set(
    raw.map(item => String(item || '').trim().toLowerCase()).filter(code => PUBLICATION_LANGUAGE_CODES.has(code)),
  )];
  if (!codes.includes('ml')) codes.push('ml');
  return codes;
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

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function sanitizeNewsroom(value) {
  const base = DEFAULT_SITE_SETTINGS.newsroom;
  const raw = value && typeof value === 'object' ? value : {};
  const languages = (Array.isArray(raw.languages) ? raw.languages : base.languages)
    .map(item => {
      if (typeof item === 'string') return { code: item.trim().toLowerCase(), label: item.trim().toUpperCase() };
      const code = String(item?.code || '').trim().toLowerCase();
      const label = String(item?.label || code.toUpperCase()).trim();
      return code ? { code, label: label || code.toUpperCase() } : null;
    })
    .filter(Boolean);
  const sourceTypes = (Array.isArray(raw.sourceTypes) ? raw.sourceTypes : base.sourceTypes)
    .map(item => String(item || '').trim().toLowerCase())
    .filter(Boolean);
  const chartColors = (Array.isArray(raw.chartColors) ? raw.chartColors : base.chartColors)
    .map(item => String(item || '').trim())
    .filter(item => /^#[0-9a-fA-F]{6}$/.test(item));
  const distribution = raw.distribution && typeof raw.distribution === 'object' ? raw.distribution : {};
  return {
    editorialSource: String(raw.editorialSource || base.editorialSource).trim().slice(0, 80) || base.editorialSource,
    communitySource: String(raw.communitySource || base.communitySource).trim().slice(0, 80) || base.communitySource,
    languages: languages.length ? languages : base.languages,
    sourceTypes: sourceTypes.length ? sourceTypes : base.sourceTypes,
    defaultCategory: String(raw.defaultCategory || base.defaultCategory).trim() || base.defaultCategory,
    defaultTrustWeight: clampNumber(raw.defaultTrustWeight, base.defaultTrustWeight, 0, 1),
    coworkStaleHours: clampNumber(raw.coworkStaleHours, base.coworkStaleHours, 1, 168),
    reviewPageSize: clampNumber(raw.reviewPageSize, base.reviewPageSize, 10, 100),
    distribution: {
      telegram: clampNumber(distribution.telegram, base.distribution.telegram, 1, 20),
      facebook: clampNumber(distribution.facebook, base.distribution.facebook, 1, 20),
      backfillLimit: clampNumber(distribution.backfillLimit, base.distribution.backfillLimit, 1, 60),
    },
    chartColors: chartColors.length ? chartColors : base.chartColors,
  };
}

export function mergeSiteSettings(partial = {}) {
  const merged = deepMerge(DEFAULT_SITE_SETTINGS, partial);
  merged.targetLanguages = parseTargetLanguages(merged.targetLanguages);
  merged.searchSuggestions = (Array.isArray(merged.searchSuggestions) ? merged.searchSuggestions : [])
    .map(term => String(term || '').trim())
    .filter(Boolean);
  merged.newsroom = sanitizeNewsroom(merged.newsroom);
  return merged;
}

export function editorialSourceName(settings) {
  return mergeSiteSettings(settings).newsroom.editorialSource;
}

export async function readSiteSettings(supabase) {
  if (!supabase) return mergeSiteSettings();
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle();
  if (error || !data?.value) return mergeSiteSettings();
  return mergeSiteSettings(data.value);
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
