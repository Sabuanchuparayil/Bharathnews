'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';
import { useLanguage } from '../context/LanguageContext';
import { localizeArticles } from '../utils/localizeArticle';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';

const DISPLAY_COUNT = 12;

function StoryRing({ article }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group flex flex-col items-center w-[4.5rem] sm:w-20 flex-shrink-0"
    >
      <div className="story-ring p-[3px] rounded-full relative">
        <SafeImage
          src={article.imageUrl}
          alt={article.displayTitle}
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
        {article.displayTitle}
      </span>
    </Link>
  );
}

const StoriesCarousel = ({ articles = [] }) => {
  const { language } = useLanguage();
  const scrollRef = useRef(null);

  const seen = new Set();
  const stories = localizeArticles(
    articles.filter(a => {
      if (!a?.slug || !a?.title || seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    }),
    language
  ).slice(0, DISPLAY_COUNT);

  if (stories.length < 3) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="py-4 border-b border-gray-100 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-accent-amber" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Top Stories
            </h2>
          </div>
          <div className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => scroll('left')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 scroll-smooth"
        >
          {stories.map((article) => (
            <StoryRing key={article.id || article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoriesCarousel;
