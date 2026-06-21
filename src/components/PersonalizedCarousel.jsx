'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';
import { getArticlesByInterests, getTrendingArticles } from '../services/articles';
import SafeImage from './SafeImage';
import { getCategoryLabel } from '../utils/categoryColors';
import { estimateReadTime } from '../utils/readState';
import { decodeHtmlEntities } from '../utils/formatters';

const PersonalizedCarousel = () => {
  const { user, userProfile } = useAuth();
  const { language } = useLanguage();
  const langFilter = toFirestoreLanguageFilter(language);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('trending');

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      if (user && userProfile?.interests?.categories && Object.keys(userProfile.interests.categories).length > 0) {
        const personalized = await getArticlesByInterests(userProfile.interests, 10, langFilter);
        if (personalized.length > 0) {
          setArticles(personalized);
          setMode('for-you');
          setLoading(false);
          return;
        }
      }
      const trending = await getTrendingArticles(10, langFilter);
      setArticles(trending);
      setMode('trending');
      setLoading(false);
    };
    load();
  }, [user, userProfile, langFilter]);

  if (loading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-6 skeleton w-40 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 h-52 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!articles.length) return null;

  const title = mode === 'for-you' ? 'For You' : 'Trending Now';
  const Icon = mode === 'for-you' ? Sparkles : TrendingUp;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-5 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-accent-amber" />
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">{title}</h2>
        </div>
        {mode === 'for-you' ? (
          <Link href="/settings" className="flex items-center space-x-1 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
            <span>Customize</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : !user ? (
          <Link href="/login" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
            Sign in for personalized feed
          </Link>
        ) : null}
      </div>

      <div className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-4 snap-x snap-mandatory">
        {(() => {
          const seen = new Set();
          return articles.filter(a => {
            if (!a?.slug || !a?.title || seen.has(a.slug)) return false;
            seen.add(a.slug);
            return true;
          });
        })().map((article, index) => {
          const titleText = decodeHtmlEntities(article.title);
          const readMin = article.readTime || estimateReadTime(`${article.title} ${article.summary || ''}`);
          return (
            <motion.div
              key={article.id || article.slug}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="flex-shrink-0 w-64 snap-start"
            >
              <Link href={`/article/${article.slug}`} className="block glass-card-solid rounded-2xl overflow-hidden group h-full">
                <div className="relative h-32 overflow-hidden">
                  <SafeImage
                    src={article.imageUrl}
                    alt={titleText}
                    category={article.category}
                    width={400}
                    height={128}
                    sizes="256px"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold uppercase bg-white/90 dark:bg-dark-surface-1/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-brand-700 dark:text-brand-300">
                      {getCategoryLabel(article.category)}
                    </span>
                  </div>
                </div>
                <div className="p-3.5">
                  <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                    {titleText}
                  </h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400 gap-2">
                    <span className="truncate">{article.source || article.author}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span>{readMin} min</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
                        Read more
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PersonalizedCarousel;
