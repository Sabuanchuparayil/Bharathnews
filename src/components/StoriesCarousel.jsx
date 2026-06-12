'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';
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
  );
}

const StoriesCarousel = ({ articles = [] }) => {
  const scrollRef = useRef(null);

  const seen = new Set();
  const stories = articles.filter(a => {
    if (!a?.slug || !a?.title || seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  }).slice(0, DISPLAY_COUNT);

  if (stories.length < 3) return null;

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-accent-amber" />
          <h2 className="font-display font-bold text-sm sm:text-base text-gray-900 dark:text-white">Top Stories</h2>
        </div>
        <div className="hidden sm:flex items-center space-x-1">
          <button type="button" onClick={() => scroll(-1)} className="btn-ghost p-1.5 rounded-lg" aria-label="Scroll left">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => scroll(1)} className="btn-ghost p-1.5 rounded-lg" aria-label="Scroll right">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
      >
        {stories.map(article => (
          <StoryRing key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
};

export default StoriesCarousel;
