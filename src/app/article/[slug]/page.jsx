import Article from '@/views/Article';
import { getArticleBySlugServer } from '@/services/firestore-server';
import { siteMetadata, articleJsonLd } from '@/lib/metadata';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlugServer(slug);
  if (!article) return { title: 'Article not found' };
  return siteMetadata({
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.summary,
    path: `/article/${slug}`,
    image: article.imageUrl,
    type: 'article',
  });
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlugServer(slug);
  if (!article) notFound();

  const jsonLd = articleJsonLd(article);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Article slug={slug} initialArticle={article} />
    </>
  );
}
