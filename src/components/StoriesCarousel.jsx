'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import SafeImage from './SafeImage';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';

const DISPLAY_COUNT = 12;

function StoryRing({ article, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="min-w-0"
    >
      <Link
        href={`/article/${article.slug}`}
        className="group flex flex-col items-center w-full max-w-[5.5rem] mx-auto sm:max-w-none"
      >
        <div className="story-ring p-[3px] rounded-full relative">
          <SafeImage
            src={article.imageUrl}
            alt={article.title}
            category={article.category}
            width={76}
            height={76}
            sizes="76px"
            className="w-14 h-14 sm:w-[4.25rem] sm:h-[4.25rem] lg:w-[4.75rem] lg:h-[4.75rem] rounded-full object-cover ring-2 ring-white dark:ring-dark-surface-0"
          />
          <span
            className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-bold uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm ${getCategoryColor(article.category)}`}
          >
            {getCategoryLabel(article.category)}
          </span>
        </div>
        <span className="mt-3 w-full text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 text-center line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
          {article.title}
        </span>
      </Link>
    </motion.div>
  );
}

const StoriesCarousel = ({ articles = [] }) => {
  const stories = articles.slice(0, DISPLAY_COUNT).filter(a => a.slug);
  if (stories.length < 4) return null;

  return (
    <section className="py-4 border-b border-gray-100 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-4 h-4 text-accent-amber" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Top Stories
          </h2>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="flex sm:hidden gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {stories.map((article, index) => (
            <div key={article.id || `${article.slug}-${index}`} className="flex-shrink-0 w-[4.75rem]">
              <StoryRing article={article} index={index} />
            </div>
          ))}
        </div>

        {/* Tablet+: auto-fill grid that wraps gracefully at every breakpoint */}
        <div className="hidden sm:grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-x-2 lg:gap-x-3 gap-y-4">
          {stories.map((article, index) => (
            <StoryRing key={article.id || `${article.slug}-${index}`} article={article} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoriesCarousel;
