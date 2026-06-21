/**
 * Article image resolution for Workers pipeline.
 * Unique per-article fallbacks (slug hash) — avoids duplicate thumbnails on Facebook/Telegram.
 */

const GLOBAL_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1547483238-2cbf881a559f?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1504465039710-0f49c0a47eb7?w=800&h=450&fit=crop',
];

const ALL_FALLBACK_IMAGES = new Set([
  ...GLOBAL_IMAGE_POOL,
  'https://images.unsplash.com/photo-1524492412937-280b9d678403?w=800',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
]);

const GENERIC_PUBLISHER_PATTERNS = [
  /og-image\.(png|jpg|jpeg|webp)/i,
  /opengraph[-_]?(default|image|share)/i,
  /default[-_]?(og|thumb|image|share)/i,
  /theme\/images\/og/i,
  /theme\/images\/th-online/i,
  /social-share/i,
  /brand[-_]logo/i,
  /\/assets\/images\/og\./i,
  /placeholder/i,
  /\/logo/i,
  /\/favicon/i,
  /1x1/i,
  /pixel\.(gif|png)/i,
];

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Publisher default OG images shared across many articles on a site. */
export function isGenericPublisherImage(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return GENERIC_PUBLISHER_PATTERNS.some(re => re.test(lower));
}

/** Unique per-article fallback — deterministic pick from large pool. */
export function getUniqueFallbackImage(seed = '', category = 'news') {
  const hash = simpleHash(`${seed}|${category}`);
  return GLOBAL_IMAGE_POOL[hash % GLOBAL_IMAGE_POOL.length];
}

/** @deprecated use getUniqueFallbackImage */
export function getCategoryFallbackImage(category, seed = '') {
  if (!seed) return getUniqueFallbackImage(category || 'news', category);
  return getUniqueFallbackImage(seed, category);
}

/** True when URL is one of our Unsplash placeholders (not a real article image). */
export function isCategoryFallbackImage(url) {
  if (!url) return true;
  if (ALL_FALLBACK_IMAGES.has(url)) return true;
  if (url.includes('images.unsplash.com/photo-')) return true;
  return false;
}

/** Pick the best publicly-fetchable image URL for social posting. */
export function resolveSocialImageUrl(article, siteUrl = 'https://www.thebharathnews.com') {
  const raw = article?.image_url || article?.imageUrl || '';
  if (raw && !isCategoryFallbackImage(raw) && !isGenericPublisherImage(raw)) {
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/')) return `${siteUrl.replace(/\/$/, '')}${raw}`;
  }
  const seed = article?.slug || article?.title || article?.source_url || article?.sourceUrl || '';
  return getUniqueFallbackImage(seed, article?.category || 'india');
}

async function fetchOgImage(url, timeoutMs = 4000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheBharathNews/2.0 (Image Resolver)' },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return '';

    const html = (await res.text()).slice(0, 120000);
    const patterns = [
      /property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi,
      /content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/gi,
      /name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/gi,
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(html)) !== null) {
        const candidate = m[1].trim();
        if (candidate.startsWith('http') && !isGenericPublisherImage(candidate) && !isCategoryFallbackImage(candidate)) {
          return candidate;
        }
      }
    }
    return '';
  } catch {
    return '';
  }
}

/** Resolve the best available image URL for an article at publish time. */
export async function resolveArticleImage({ imageUrl, sourceUrl, category, slug, title, ogTimeoutMs = 4000 }) {
  if (imageUrl && !isCategoryFallbackImage(imageUrl) && !isGenericPublisherImage(imageUrl)) {
    return imageUrl;
  }
  if (sourceUrl) {
    const og = await fetchOgImage(sourceUrl, ogTimeoutMs);
    if (og) return og;
  }
  return getUniqueFallbackImage(slug || title || sourceUrl || '', category);
}
