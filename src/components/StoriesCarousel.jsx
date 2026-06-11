'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import SafeImage from './SafeImage';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';

const StoriesCarousel = ({ articles = [] }) => {
  if (!articles.length) return null;

  const stories = articles.slice(0, 8).filter(a => a.slug);

  return (
    <section className="py-4 border-b border-gray-100 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-4 h-4 text-accent-amber" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Top Stories
          </h2>
        </div>
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {stories.map((article, index) => (
            <motion.div
              key={article.id || `${article.slug}-${index}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0"
            >
              <Link
                href={`/article/${article.slug}`}
                className="group flex flex-col items-center w-[72px] sm:w-24"
              >
                <div className="story-ring p-[3px] rounded-full relative">
                  <SafeImage
                    src={article.imageUrl}
                    alt={article.title}
                    category={article.category}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-white dark:ring-dark-surface-0"
                  />
                  <span
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm ${getCategoryColor(article.category)}`}
                  >
                    {getCategoryLabel(article.category)}
                  </span>
                </div>
                <span className="mt-3 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 text-center line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
                  {article.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoriesCarousel;
