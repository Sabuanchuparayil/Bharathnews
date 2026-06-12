/** Category-specific fallback images when RSS / og:image is unavailable.
 *  Multiple images per category so adjacent articles look different. */

const CATEGORY_IMAGE_POOL = {
  india: [
    'https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
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
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=450&fit=crop',
  ],
  health: [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=450&fit=crop',
  ],
  education: [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=450&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450&fit=crop',
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

/** Local placeholder — always available, used as last-resort fallback in SafeImage. */
export const LOCAL_PLACEHOLDER = '/og-default.png';

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getCategoryFallbackImage(category, seed = '') {
  const key = (category || '').toLowerCase().replace(/[\s-]/g, '');
  const pool = CATEGORY_IMAGE_POOL[key] || DEFAULT_IMAGES;
  const idx = seed ? simpleHash(seed) % pool.length : Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function resolveArticleImage(article) {
  if (article?.imageUrl) return article.imageUrl;
  return getCategoryFallbackImage(article?.category, article?.slug || article?.title || '');
}
