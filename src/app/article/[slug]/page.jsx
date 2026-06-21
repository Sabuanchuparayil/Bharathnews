import Article from '@/views/Article';
import { getArticleBySlugServer } from '@/services/articles-server';
import { siteMetadata, articleJsonLd, breadcrumbJsonLd, safeJsonLd } from '@/lib/metadata';
import { notFound } from 'next/navigation';

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

  return siteMetadata({
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.summary,
    path: `/article/${slug}`,
    image: article.imageUrl,
    type: 'article',
    keywords: article.tags,
    publishedTime,
    modifiedTime,
  });
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlugServer(slug);
  if (!article) notFound();

  const jsonLd = articleJsonLd(article);
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    ...(article.category ? [{ name: article.category.charAt(0).toUpperCase() + article.category.slice(1), url: `/${article.category}` }] : []),
    { name: article.title },
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
