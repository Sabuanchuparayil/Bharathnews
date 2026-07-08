/** Article image resolution — unique thumbnails, reject generic publisher defaults. */

/** Branded last-resort fallback — always loads from our domain. */
export const LOCAL_PLACEHOLDER = '/logo-mark.png';

/**
 * News-themed landscape fallbacks only — no portraits or close-up faces.
 * All URLs use explicit crop params for 16:9 thumbnails.
 */
const GLOBAL_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1504465039710-0f49c0a47eb7?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=450&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=800&h=450&fit=crop&crop=center',
];

const CATEGORY_IMAGE_POOL = {
  sports: [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=450&fit=crop&crop=center',
  ],
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop&crop=center',
  ],
  business: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop&crop=center',
  ],
  gcc: [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=450&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&h=450&fit=crop&crop=center',
  ],
  india: [
    'https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800&h=450&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=450&fit=crop&crop=center',
  ],
};

const ALL_FALLBACK_URLS = new Set([
  ...GLOBAL_IMAGE_POOL,
  'https://images.unsplash.com/photo-1524492412937-280b9d678403?w=800',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  // Legacy portrait fallbacks — treat as placeholders so they get replaced
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1547483238-2cbf881a559f?w=800&h=450&fit=crop',
]);

const GENERIC_PUBLISHER_PATTERNS = [
  /og-image\.(png|jpg|jpeg|webp)/i,
  /opengraph[-_]?(default|image|share)/i,
  /default[-_]?(og|thumb|image|share)/i,
  /1x1/i,
  /spacer\.(png|gif|jpg)/i,
  /badge/i,
  /preferred_source/i,
  /scorecardresearch/i,
  /doubleclick/i,
  /googlesyndication/i,
  /google-analytics/i,
  /facebook\.com\/tr/i,
  /\/p\?c1=/i,
  /\/logo/i,
  /\/favicon/i,
  /\/icons?\//i,
  /placeholder/i,
  /theme\/images\/og/i,
  /theme\/images\/th-online/i,
  /social-share/i,
  /brand[-_]logo/i,
  /\/assets\/images\/og\./i,
  /pixel\.(gif|png)/i,
  /tracking/i,
  /picsum\.photos/i,
];

const TRUSTED_IMAGE_HOSTS = [
  'ndtvimg.com', 'toiimg.com', 'thgim.com', 'hindustantimes.com', 'indiatimes.com',
  'aljazeera.com', 'bbc.com', 'bbci.co.uk', 'oneindia.com', 'livemint.com',
  'thehindu.com', 'unsplash.com', 'ytimg.com', 'wp.com', 'cloudfront.net',
  'etimg.com', 'economictimes.com', 'img.etimg.com', 'static.toiimg.com',
  'media.assettype.com', 'images.indianexpress.com', 'cdn.shopify.com',
  'akamaized.net', 'amazonaws.com', 'googleusercontent.com', 'twimg.com',
  'asianetnews.com', 'newsable.asianetnews.com', 'static.asianetnews.com',
];

function looksLikeImageUrl(url) {
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?|#|$)/i.test(lower)) return true;
  if (TRUSTED_IMAGE_HOSTS.some(h => lower.includes(h))) return true;
  if (lower.includes('/uploads/') || lower.includes('/thumb/') || lower.includes('/images/')) return true;
  return false;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function normalizeCategory(category = '') {
  const c = String(category).toLowerCase();
  if (c.includes('sport')) return 'sports';
  if (c.includes('tech')) return 'tech';
  if (c.includes('business') || c.includes('money') || c.includes('finance')) return 'business';
  if (c.includes('gcc') || c.includes('gulf') || c.includes('uae')) return 'gcc';
  if (c.includes('india') || c.includes('kerala') || c.includes('world')) return 'india';
  return 'news';
}

/** Unique per-article fallback — deterministic pick from category-aware pool. */
export function getUniqueFallbackImage(seed = '', category = 'news') {
  const pool = CATEGORY_IMAGE_POOL[normalizeCategory(category)] || GLOBAL_IMAGE_POOL;
  const hash = simpleHash(`${seed}|${category}`);
  return pool[hash % pool.length];
}

/** @deprecated use getUniqueFallbackImage */
export function getCategoryFallbackImage(category, seed = '') {
  if (seed) return getUniqueFallbackImage(seed, category);
  const pool = CATEGORY_IMAGE_POOL[normalizeCategory(category)] || GLOBAL_IMAGE_POOL;
  const idx = simpleHash(category || 'news') % pool.length;
  return pool[idx];
}

/** Publisher default OG images shared across many articles on a site. */
export function isGenericPublisherImage(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return GENERIC_PUBLISHER_PATTERNS.some(re => re.test(lower));
}

/** True when URL cannot be displayed as an article thumbnail. */
export function isInvalidImageUrl(url) {
  if (!url || typeof url !== 'string') return true;
  if (isGenericPublisherImage(url)) return true;
  if (url.startsWith('/')) return false;
  if (!url.startsWith('http')) return true;
  return !looksLikeImageUrl(url);
}

/** True when URL is a generic placeholder, not a real article thumbnail. */
export function isStoredPlaceholderImage(url) {
  if (!url || typeof url !== 'string') return true;
  if (url === LOCAL_PLACEHOLDER || url.endsWith('/logo-mark.png')) return true;
  if (ALL_FALLBACK_URLS.has(url)) return true;
  if (url.includes('images.unsplash.com/photo-')) return true;
  if (isInvalidImageUrl(url)) return true;
  return false;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function scoreImageCandidate(url) {
  if (!url || isGenericPublisherImage(url)) return -1;
  if (!looksLikeImageUrl(url)) return -1;
  const lower = url.toLowerCase();
  let score = 1;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(lower)) score += 3;
  if (lower.includes('thumb') || lower.includes('featured') || lower.includes('uploads') || lower.includes('alternates')) score += 2;
  if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') || lower.includes('badge')) score -= 10;
  if (lower.includes('1200') || lower.includes('1280') || lower.includes('1920') || lower.includes('landscape')) score += 1;
  return score;
}

function extractImagesFromHtml(html) {
  const found = [];
  const patterns = [
    /property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/gi,
    /name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/gi,
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const url = decodeHtmlEntities(m[1].trim());
      if (url.startsWith('http')) found.push(url);
    }
  }
  return found
    .map(u => ({ url: u, score: scoreImageCandidate(u) }))
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .map(x => x.url);
}

export async function fetchOgImage(url, timeoutMs = 5000) {
  if (!url) return '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheBharathNews/2.0)' },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const html = (await res.text()).slice(0, 200000);
    const candidates = extractImagesFromHtml(html);
    for (const candidate of candidates.slice(0, 8)) {
      if (!isInvalidImageUrl(candidate) && !isStoredPlaceholderImage(candidate)) {
        return candidate;
      }
    }
    return '';
  } catch {
    return '';
  }
}

export async function resolveBestArticleImage({ imageUrl, sourceUrl, category, slug, title }) {
  if (imageUrl && !isStoredPlaceholderImage(imageUrl)) return imageUrl;
  if (sourceUrl) {
    const og = await fetchOgImage(sourceUrl);
    if (og && !isStoredPlaceholderImage(og)) return og;
  }
  return '';
}

export function resolveArticleImage(article) {
  const url = article?.imageUrl || article?.image_url;
  if (url && typeof url === 'string') {
    if (url.startsWith('/')) return url;
    if (url.startsWith('http') && !isGenericPublisherImage(url) && !isStoredPlaceholderImage(url)) {
      return url;
    }
  }
  return getUniqueFallbackImage(article?.slug || article?.title || '', article?.category);
}

/** True when URL is a real article thumbnail suitable for social/RSS (not Unsplash placeholder). */
export function isRealArticleImage(url) {
  if (!url || typeof url !== 'string') return false;
  if (isStoredPlaceholderImage(url)) return false;
  if (isGenericPublisherImage(url)) return false;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) return true;
  return false;
}

/** Direct HTTPS URL for RSS/social crawlers — never use Next.js image proxy. */
export function getDirectSocialImageUrl(imageUrl, siteUrl = '') {
  if (!isRealArticleImage(imageUrl)) return '';
  if (imageUrl.startsWith('/')) {
    const base = (siteUrl || '').replace(/\/$/, '');
    return base ? `${base}${imageUrl}` : '';
  }
  if (imageUrl.startsWith('http://')) return imageUrl.replace(/^http:\/\//, 'https://');
  return imageUrl;
}

export function shouldReplaceImage(url, duplicateCount = 1) {
  if (isStoredPlaceholderImage(url)) return true;
  if (isInvalidImageUrl(url)) return true;
  if (duplicateCount >= 2 && isGenericPublisherImage(url)) return true;
  if (duplicateCount >= 3) return true;
  return false;
}

/** Tailwind classes for news thumbnails — top-aligned crop in landscape containers. */
export const NEWS_THUMB_CLASS = 'object-cover object-top';
