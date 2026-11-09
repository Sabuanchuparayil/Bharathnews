import Article from '@/views/Article';
import { getArticleBySlugServer } from '@/services/articles-server';
import { siteMetadata, articleJsonLd, breadcrumbJsonLd, safeJsonLd, articleLanguageAlternates, articleOgImageUrl } from '@/lib/metadata';
import { notFound } from 'next/navigation';
import { CATEGORY_ROUTES } from '@/config/category-taxonomy';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlugServer(slug);
  if (!article) return { title: 'Article not found' };

  const publishedTime = article.publishedAt?.seconds
    ? new Date(article.publishedAt.seconds * 1000).toISOString()
    : undefined;
  const modifiedTime = article.updatedAt?.seconds
    ? new Date(article.updatedAt.seconds * 1000).toISOString()
    : publishedTime;

  return {
    ...siteMetadata({
      title: article.seo?.metaTitle || article.title,
      description: article.seo?.metaDescription || article.summary,
      path: `/article/${slug}`,
      image: articleOgImageUrl({
        title: article.seo?.metaTitle || article.title,
        category: article.category,
        language: article.language,
        imageUrl: article.imageUrl,
      }),
      type: 'article',
      keywords: article.tags,
      publishedTime,
      modifiedTime,
    }),
    alternates: articleLanguageAlternates(slug, article.language || 'en', article.translations),
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlugServer(slug);
  if (!article) notFound();

  const jsonLd = articleJsonLd(article);
  const categoryKey = (article.category || '').toLowerCase();
  const categoryRoute = CATEGORY_ROUTES[categoryKey];
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    ...(categoryKey ? [{
      name: categoryRoute?.title || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
      url: categoryRoute?.path || `/${categoryKey}`,
    }] : []),
    { name: article.title, url: `/article/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd([jsonLd, breadcrumb]) }}
      />
      <Article slug={slug} initialArticle={article} />
    </>
  );
}
