'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import RelativeTime from './RelativeTime';
import SafeImage from './SafeImage';
import ShareButton from './ShareButton';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import { decodeHtmlEntities } from '../utils/formatters';
import { articleDisplayDate } from '../utils/articleDates';

const HeroSection = ({ featured = [] }) => {
  if (!featured.length || !featured[0]?.slug) return null;

  const main = featured[0];
  const secondary = featured.slice(1, 4).filter(a => a.slug);

  return (
    <section className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 relative group"
          >
            <div className="relative">
              <Link href={`/article/${main.slug}`} className="block">
              <div className="relative h-72 sm:h-80 lg:h-[420px] rounded-3xl overflow-hidden">
                <SafeImage
                  src={main.imageUrl}
                  alt={main.title}
                  category={main.category}
                  width={1200}
                  height={420}
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  priority
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full backdrop-blur-sm ${getCategoryColor(main.category)}`}>
                      {getCategoryLabel(main.category)}
                    </span>
                    <span className="flex items-center space-x-1 text-xs text-gray-200">
                      <TrendingUp className="w-3 h-3" />
                      <span>Trending</span>
                    </span>
                  </div>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight text-balance mb-3">
                    {decodeHtmlEntities(main.title)}
                  </h1>
                  <p className="text-sm text-gray-200 line-clamp-2 max-w-xl mb-4">
                    {decodeHtmlEntities(main.summary)}
                  </p>
                  <div className="flex items-center justify-between gap-4 mt-4">
                    <div className="flex items-center space-x-4 text-xs text-gray-300">
                      <span>{main.author}</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <RelativeTime date={articleDisplayDate(main)} />
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:underline">
                      Read more
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
              </Link>
              <div className="absolute top-4 right-4 z-10">
                <ShareButton
                  title={main.title}
                  text={main.summary}
                  path={`/article/${main.slug}`}
                  contentType="article"
                  size="sm"
                  className="[&_button]:bg-black/40 [&_button]:text-white [&_button]:hover:bg-black/60"
                />
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-2 flex flex-col space-y-4">
            {secondary.map((article, index) => (
              <motion.div
                key={article.id || index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <Link href={`/article/${article.slug}`}
                  className="group flex space-x-4 glass-card-solid rounded-2xl p-4 h-full"
                >
                  <SafeImage
                    src={article.imageUrl}
                    alt={article.title}
                    category={article.category}
                    width={112}
                    height={112}
                    sizes="112px"
                    className="w-24 h-24 lg:w-28 lg:h-28 object-cover rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{getCategoryLabel(article.category)}</span>
                      <h3 className="font-display font-bold text-sm lg:text-base text-gray-900 dark:text-white line-clamp-2 mt-1 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                        {article.title}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mt-2">
                      <span className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <RelativeTime date={articleDisplayDate(article)} />
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
                        Read more
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
