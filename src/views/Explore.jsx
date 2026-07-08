'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Briefcase, ShoppingBag } from 'lucide-react';
import Layout from '../components/Layout';
import { SECTIONS, HEADER_NAV, getSubcategoriesForSection } from '../config/feeds.config';
import { getSectionPreviewArticles, getMostReadArticles } from '../services/articles';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';
import NewsCard from '../components/NewsCard';
import SafeImage from '../components/SafeImage';
import { decodeHtmlEntities } from '../utils/formatters';

const Discover = () => {
  const { language } = useLanguage();
  const langFilter = toFirestoreLanguageFilter(language);
  const [sectionPreviews, setSectionPreviews] = useState({});
  const [mostRead, setMostRead] = useState([]);
  const [loading, setLoading] = useState(true);

  const browseSections = HEADER_NAV.filter(n => n.sectionId && n.sectionId !== 'top-stories');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      Promise.all(
        browseSections.map(async ({ sectionId }) => {
          const articles = await getSectionPreviewArticles(sectionId, 2, langFilter);
          return [sectionId, articles];
        })
      ),
      getMostReadArticles(5, langFilter),
    ]).then(([previews, topRead]) => {
      setSectionPreviews(Object.fromEntries(previews));
      setMostRead(topRead);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [langFilter]);

  return (
    <Layout mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-2">
          Discover
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Explore every section of The Bharath News — interest-first navigation built for the India-GCC diaspora.
        </p>
      </div>

      {mostRead.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-amber" />
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Most Read Today</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mostRead.slice(0, 3).map((article, i) => (
              <NewsCard key={article.slug} article={article} variant={i === 0 ? 'featured' : 'default'} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="space-y-12">
        {browseSections.map(({ sectionId, path, label }) => {
          const section = SECTIONS[sectionId];
          const articles = sectionPreviews[sectionId] || [];
          const subs = getSubcategoriesForSection(sectionId).filter(s => s.id !== 'all');

          return (
            <section key={sectionId} className="glass-card-solid rounded-3xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-0">
                <div className={`p-6 sm:p-8 flex flex-col justify-between ${section?.color || 'bg-gray-100'}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Section</p>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl mb-2">{label}</h2>
                    <p className="text-sm opacity-80 leading-relaxed">{section?.description}</p>
                  </div>
                  <Link
                    href={path}
                    className="inline-flex items-center gap-2 mt-6 text-sm font-semibold hover:gap-3 transition-all"
                  >
                    Explore {label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="p-6 sm:p-8 bg-white/50 dark:bg-dark-surface-1/50">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="h-20 skeleton rounded-xl" />
                      <div className="h-20 skeleton rounded-xl" />
                    </div>
                  ) : articles.length > 0 ? (
                    <div className="space-y-4">
                      {articles.map(article => (
                        <Link
                          key={article.slug}
                          href={`/article/${article.slug}`}
                          className="flex gap-3 group p-2 -m-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
                        >
                          <SafeImage
                            src={article.imageUrl}
                            alt={article.title}
                            category={article.category}
                            width={80}
                            height={64}
                            className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                              {decodeHtmlEntities(article.title)}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">{article.source || article.author}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Stories coming soon.</p>
                  )}

                  {subs.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {subs.map(sub => (
                          <Link
                            key={sub.id}
                            href={`${path}?sub=${sub.id}`}
                            className="text-xs px-3 py-1.5 rounded-full bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Marketplace Promo */}
      <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/jobs" className="glass-card-solid rounded-2xl p-6 hover:shadow-lg transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-brand-600" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">GCC Jobs</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Find job opportunities for Indian professionals across UAE, Saudi, Qatar, and more.</p>
          <span className="text-sm font-semibold text-brand-600 group-hover:gap-2 flex items-center gap-1 transition-all">
            Browse Jobs <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
        <Link href="/classifieds" className="glass-card-solid rounded-2xl p-6 hover:shadow-lg transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">Classifieds</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Buy, sell, rent, and find services across the Gulf. Free ads for Indian expats.</p>
          <span className="text-sm font-semibold text-green-600 group-hover:gap-2 flex items-center gap-1 transition-all">
            Browse Classifieds <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </section>
    </Layout>
  );
};

export default Discover;
