import { getSupabaseAdmin } from '@/lib/supabase-server';
import { SITE_URL } from '@/lib/site-url';
import { SECTIONS, CATEGORY_ROUTES } from '@/config/category-taxonomy';

const LEGACY_CATEGORIES = Object.keys(CATEGORY_ROUTES);

const LANGUAGES = ['en', 'hi', 'ml', 'ta', 'te', 'kn', 'bn'];

export default async function sitemap() {
  const sectionPages = Object.values(SECTIONS)
    .filter(s => s.path !== '/')
    .map(s => ({
      url: `${SITE_URL}${s.path}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.95,
    }));

  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/videos`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/editorial`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  const legacyCategoryPages = LEGACY_CATEGORIES.map(cat => {
    const route = CATEGORY_ROUTES[cat];
    return {
      url: `${SITE_URL}${route.path}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.85,
    };
  });

  const subcategoryPages = Object.values(SECTIONS).flatMap(section =>
    section.subcategories
      .filter(sub => sub.id !== 'all')
      .map(sub => ({
        url: `${SITE_URL}${section.path}?sub=${sub.id}`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.75,
      }))
  );

  const feedPages = [
    { url: `${SITE_URL}/feed.xml`, lastModified: new Date(), changeFrequency: 'always', priority: 0.6 },
    ...LANGUAGES.map(lang => ({
      url: `${SITE_URL}/feed.xml?lang=${lang}`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.5,
    })),
  ];

  let articlePages = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('articles')
      .select('slug, published_at, updated_at, language')
      .or('editorial_status.eq.published,editorial_status.is.null')
      .order('created_at', { ascending: false })
      .limit(2000);

    articlePages = (data || [])
      .filter(row => row.slug)
      .map(row => ({
        url: `${SITE_URL}/article/${row.slug}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : row.published_at ? new Date(row.published_at) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
  } catch (err) {
    console.error('[sitemap] Failed to fetch articles:', err.message);
  }

  return [
    ...staticPages,
    ...sectionPages,
    ...legacyCategoryPages,
    ...subcategoryPages,
    ...feedPages,
    ...articlePages,
  ];
}
