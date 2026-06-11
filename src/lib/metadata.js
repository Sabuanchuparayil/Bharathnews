const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebharathnews.com';
const SITE_NAME = 'The Bharath News';

export function siteMetadata({ title, description, path = '', image, type = 'website' }) {
  const url = `${SITE_URL}${path}`;
  return {
    title: title ? `${title} | ${SITE_NAME}` : SITE_NAME,
    description: description || 'AI-Powered News for India and GCC. Breaking news, business, technology, and community stories.',
    alternates: { canonical: url },
    openGraph: {
      title: title || SITE_NAME,
      description: description || 'AI-Powered News for India and GCC regions',
      url,
      siteName: SITE_NAME,
      type,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: title || SITE_NAME,
      description: description || 'AI-Powered News for India and GCC regions',
      images: image ? [image] : [],
    },
  };
}

export function articleJsonLd(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: article.imageUrl,
    datePublished: article.publishedAt?.seconds
      ? new Date(article.publishedAt.seconds * 1000).toISOString()
      : new Date().toISOString(),
    author: { '@type': 'Person', name: article.author || 'The Bharath News' },
    publisher: {
      '@type': 'Organization',
      name: 'The Bharath News',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512x512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/article/${article.slug}` },
  };
}
