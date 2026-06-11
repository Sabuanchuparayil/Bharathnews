'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { getCategoryLabel } from '../utils/categoryColors';
import { useLanguage } from '../context/LanguageContext';
import { localizeArticles } from '../utils/localizeArticle';

const TrendingSection = ({ articles = [] }) => {
  const { language } = useLanguage();
  const validArticles = articles.filter(a => a?.slug && a?.title);
  if (!validArticles.length) return null;

  const seen = new Set();
  const uniqueArticles = localizeArticles(
    validArticles.filter(a => {
      if (seen.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    }),
    language
  ).slice(0, 10);

  return (
    <div className="glass-card-solid rounded-2xl p-5">
      <div className="flex items-center space-x-2 mb-5">
        <div className="w-8 h-8 bg-accent-emerald/10 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-accent-emerald" />
        </div>
        <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">Trending</h3>
      </div>

      <div className="space-y-3">
        {uniqueArticles.map((article, index) => (
          <Link
            key={article.id || article.slug}
            href={`/article/${article.slug}`}
            className="group flex items-start space-x-3 p-2 -mx-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
          >
            <span className="flex-shrink-0 w-7 h-7 bg-brand-50 dark:bg-brand-950/50 rounded-lg flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                {article.displayTitle}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getCategoryLabel(article.category)} · {(article.views || 0).toLocaleString()} views</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingSection;
