import { SITE_NAME, SITE_URL } from './constants';

export function generateArticleMeta(article) {
  return {
    title: `${article.seo?.metaTitle || article.title} | ${SITE_NAME}`,
    description: article.seo?.metaDescription || article.summary,
    keywords: article.seo?.keywords?.join(', ') || '',
    ogImage: article.seo?.ogImage || article.imageUrl,
    canonical: `${SITE_URL}/article/${article.slug}`,
  };
}

export function generatePageMeta(title, description) {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    canonical: SITE_URL,
  };
}
