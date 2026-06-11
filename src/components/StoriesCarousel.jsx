'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap } from 'lucide-react';

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
              key={article.id || index}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0"
            >
              <Link href={`/article/${article.slug}`}
                className="group flex flex-col items-center w-[72px] sm:w-20"
              >
                <div className="story-ring p-[3px] rounded-full">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-white dark:ring-dark-surface-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 ring-2 ring-white dark:ring-dark-surface-0 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">{(article.category || '?')[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <span className="mt-2 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 text-center line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {article.category}
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
