/** Category-specific fallback images when RSS / og:image is unavailable.
 *  Multiple images per category so articles don't all look identical. */

const CATEGORY_IMAGE_POOL = {
  india: [
    'https://images.unsplash.com/photo-1524492412937-280b57ca018c?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=450&fit=crop',
  ],
  gcc: [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1547483238-2cbf881a559f?w=800&h=450&fit=crop',
  ],
  business: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
  ],
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop',
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba7951?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=450&fit=crop',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1489599849927-2fa91ead3d88?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop',
  ],
  health: [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=450&fit=crop',
  ],
  education: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=450&fit=crop',
  ],
  jobs: [
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=450&fit=crop',
  ],
  realestate: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=450&fit=crop',
  ],
  lifestyle: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=450&fit=crop',
  ],
  opinion: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop',
  ],
  world: [
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=800&h=450&fit=crop',
  ],
  breaking: [
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1504465039710-0f49c0a47eb7?w=800&h=450&fit=crop',
  ],
};

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
  'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&h=450&fit=crop',
];

const ALL_FALLBACK_IMAGES = new Set([
  ...DEFAULT_IMAGES,
  ...Object.values(CATEGORY_IMAGE_POOL).flat(),
]);

let _pickCounter = 0;

export function getCategoryFallbackImage(category) {
  const key = (category || '').toLowerCase().replace(/[\s-]/g, '');
  const pool = CATEGORY_IMAGE_POOL[key] || DEFAULT_IMAGES;
  return pool[(_pickCounter++) % pool.length];
}

/** True when URL is one of our Unsplash category placeholders (not a real article image). */
export function isCategoryFallbackImage(url) {
  return !url || ALL_FALLBACK_IMAGES.has(url);
}

async function fetchOgImage(url, timeoutMs = 4000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheBharathNews/1.0 (Image Resolver)' },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return '';

    const html = (await res.text()).slice(0, 120000);
    const og =
      html.match(/property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/i) ||
      html.match(/name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i);

    return og ? og[1].trim() : '';
  } catch {
    return '';
  }
}

/** Resolve the best available image URL for an article. */
export async function resolveArticleImage({ imageUrl, sourceUrl, category, ogTimeoutMs = 4000 }) {
  if (imageUrl && !isCategoryFallbackImage(imageUrl)) return imageUrl;
  if (sourceUrl) {
    const og = await fetchOgImage(sourceUrl, ogTimeoutMs);
    if (og) return og;
  }
  return getCategoryFallbackImage(category);
}
