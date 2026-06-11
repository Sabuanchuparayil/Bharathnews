/** Category-specific fallback images when RSS / og:image is unavailable. */

const CATEGORY_IMAGES = {
  india: 'https://images.unsplash.com/photo-1524492412937-280b57ca018c?w=800&h=450&fit=crop',
  gcc: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=450&fit=crop',
  business: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba7951?w=800&h=450&fit=crop',
  entertainment: 'https://images.unsplash.com/photo-1489599849927-2fa91ead3d88?w=800&h=450&fit=crop',
  health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
  education: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop',
  jobs: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=450&fit=crop',
  realestate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop',
  lifestyle: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=450&fit=crop',
  opinion: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
  world: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop',
  breaking: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop';

export function getCategoryFallbackImage(category) {
  const key = (category || '').toLowerCase().replace(/[\s-]/g, '');
  return CATEGORY_IMAGES[key] || DEFAULT_IMAGE;
}

async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
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
export async function resolveArticleImage({ imageUrl, sourceUrl, category }) {
  if (imageUrl) return imageUrl;
  if (sourceUrl) {
    const og = await fetchOgImage(sourceUrl);
    if (og) return og;
  }
  return getCategoryFallbackImage(category);
}
