'use client';

import React from 'react';
import NewsCard from './NewsCard';
import NewsletterSignup from './NewsletterSignup';

const NewsMasonryGrid = ({ articles = [], loading = false, showMobileNewsletter = false, cardVariant = 'default' }) => {
  if (loading) {
    return (
      <div className="masonry-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="masonry-item">
            <div className="glass-card-solid rounded-2xl overflow-hidden">
              <div className={`skeleton ${i % 3 === 0 ? 'h-64' : 'h-48'}`} />
              <div className="p-5 space-y-3">
                <div className="h-4 skeleton w-1/4" />
                <div className="h-5 skeleton w-3/4" />
                <div className="h-4 skeleton w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = [];
  articles.forEach((article, index) => {
    items.push(
      <div key={article.id || index} className="masonry-item">
        <NewsCard
          article={article}
          index={index}
          variant={cardVariant}
        />
      </div>
    );
    if (showMobileNewsletter && (index + 1) % 6 === 0) {
      items.push(
        <div key={`newsletter-${index}`} className="masonry-item lg:hidden">
          <NewsletterSignup />
        </div>
      );
    }
  });

  return <div className="masonry-grid">{items}</div>;
};

export default NewsMasonryGrid;
