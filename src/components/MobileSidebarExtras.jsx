'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import SafeImage from './SafeImage';
import ChannelFollowCTA from './ChannelFollowCTA';
import { getCategoryLabel } from '../utils/categoryColors';

export function MobileTrendingStrip({ articles = [] }) {
  const seen = new Set();
  const items = articles
    .filter(a => {
      if (!a?.slug || !a?.title || seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    })
    .slice(0, 6);

  if (!items.length) return null;

  return (
    <section className="lg:hidden py-4 border-b border-gray-100 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent-emerald" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Trending Now
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {items.map((article, index) => (
            <Link
              key={article.id || `${article.slug}-${index}`}
              href={`/article/${article.slug}`}
              className="flex-shrink-0 w-40 sm:w-44 group"
            >
              <div className="relative h-24 rounded-xl overflow-hidden mb-2">
                <SafeImage
                  src={article.imageUrl}
                  alt={article.title}
                  category={article.category}
                  width={176}
                  height={96}
                  sizes="176px"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center text-[11px] font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                {article.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getCategoryLabel(article.category)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MobileSidebarExtras({ trendingArticles = [] }) {
  return (
    <div className="lg:hidden space-y-6">
      <MobileTrendingStrip articles={trendingArticles} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ChannelFollowCTA />
      </div>
    </div>
  );
}
