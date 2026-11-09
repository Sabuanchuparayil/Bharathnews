import { notFound } from 'next/navigation';
import PravasiPost from '@/views/PravasiPost';
import { getPublishedPravasiPost } from '@/services/articles-server';
import { siteMetadata } from '@/lib/metadata';
import { pravasiPublicPath } from '@/lib/pravasi';
import { SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPublishedPravasiPost(slug);
  if (!post) return { title: 'Not found' };
  return siteMetadata({
    title: post.title,
    description: post.excerpt || post.body?.slice(0, 160),
    path: pravasiPublicPath(post),
    image: post.coverImage || undefined,
    type: 'article',
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const post = await getPublishedPravasiPost(slug);
  if (!post) notFound();
  const path = pravasiPublicPath(post);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    author: { '@type': 'Person', name: post.authorName || 'Pravasi Jaalakam' },
    mainEntityOfPage: `${SITE_URL}${path}`,
    image: post.coverImage || undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PravasiPost post={post} />
    </>
  );
}
