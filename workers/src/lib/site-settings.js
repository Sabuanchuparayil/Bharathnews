/** Worker-side site settings (mirrors src/lib/site-settings.js). */

export const DEFAULT_SITE_SETTINGS = {
  qualityThreshold: 6,
  targetLanguages: ['ml', 'hi', 'ta', 'te', 'kn', 'bn', 'ur'],
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
      // false = dlvr.it posts via RSS feed; true = Worker Graph API (needs page token)
      graphApiEnabled: false,
      dlvrItFeedUrl: 'https://www.thebharathnews.com/feed/social-ml.xml',
      dlvrItEnglishFeedUrl: 'https://www.thebharathnews.com/feed/social-en.xml',
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
};

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

export function parseTargetLanguages(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return DEFAULT_SITE_SETTINGS.targetLanguages;
}

export function mergeSiteSettings(partial = {}) {
  const merged = deepMerge(DEFAULT_SITE_SETTINGS, partial);
  merged.targetLanguages = parseTargetLanguages(merged.targetLanguages);
  return merged;
}

export function resolveTelegramConfig(settings, env) {
  const cfg = mergeSiteSettings(settings).integrations?.telegram || {};
  return {
    enabled: cfg.enabled !== false,
    channelId: cfg.channelId || env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID || '@TheBharathNews',
    minScore: cfg.minScoreToPost ?? 7,
    hasBotToken: Boolean(env.TELEGRAM_BOT_TOKEN),
  };
}

export function resolveEmailConfig(settings, env) {
  const cfg = mergeSiteSettings(settings).integrations?.email || {};
  return {
    enabled: cfg.enabled !== false && cfg.digestEnabled !== false,
    from: cfg.newsletterFrom || env.NEWSLETTER_FROM || 'The Bharath News <news@thebharathnews.com>',
    subject: cfg.digestSubject || 'Your Weekly Digest — The Bharath News',
    hasApiKey: Boolean(env.RESEND_API_KEY),
  };
}

export function resolveFacebookConfig(settings, env) {
  const cfg = mergeSiteSettings(settings).integrations?.facebook || {};
  const hasToken = Boolean(env.FACEBOOK_PAGE_TOKEN && env.FACEBOOK_PAGE_ID);
  const graphApiEnabled = cfg.graphApiEnabled === true && hasToken;
  return {
    enabled: cfg.enabled !== false,
    graphApiEnabled,
    dlvrItMode: !graphApiEnabled,
    dlvrItFeedUrl: cfg.dlvrItFeedUrl || 'https://www.thebharathnews.com/feed/social-ml.xml',
    minScore: cfg.minScoreToPost ?? 7,
    postLanguage: cfg.postLanguage || env.FACEBOOK_POST_LANGUAGE || 'ml',
    catchupBatchSize: Math.min(Math.max(cfg.catchupBatchSize ?? 1, 1), 3),
    hasToken,
  };
}

export function shouldShowWhatsAppCta(settings) {
  const cfg = mergeSiteSettings(settings).integrations?.whatsapp || {};
  return cfg.enabled !== false && cfg.showFollowCta !== false && Boolean(cfg.channelUrl);
}
