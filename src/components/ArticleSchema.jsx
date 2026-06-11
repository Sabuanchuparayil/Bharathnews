import React from 'react';

const ArticleSchema = ({ article }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: article.imageUrl,
    datePublished: article.publishedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: article.author || 'The Bharath News',
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Bharath News',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thebharathnews.com/icons/icon-512x512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://thebharathnews.com/article/${article.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  );
};

export default ArticleSchema;
