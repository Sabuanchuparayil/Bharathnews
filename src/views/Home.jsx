'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Newspaper, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import NriRatesWidget from '../components/NriRatesWidget';
import HomeVideoStrip from '../components/HomeVideoStrip';
import PersonalizedCarousel from '../components/PersonalizedCarousel';
import SectionPreviews from '../components/SectionPreviews';
import CategoryFilter from '../components/CategoryFilter';
import OnboardingModal from '../components/OnboardingModal';
import EmptyState from '../components/EmptyState';
import NewsMasonryGrid from '../components/NewsMasonryGrid';
import { getHomeCategories } from '../config/feeds.config';
import { toFirestoreLanguageFilter } from '@/config/languages.config';
import { useLanguage } from '../context/LanguageContext';
import { fetchUniqueArticles, getTrendingArticles } from '../services/articles';
import { updateLastVisitTime } from '../utils/readState';

const PAGE_SIZE = 12;
const FEATURED_COUNT = 4;

const Home = () => {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const langFilter = toFirestoreLanguageFilter(language);
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const isBreakingView = activeCategory === 'breaking';

  useEffect(() => {
    updateLastVisitTime();
  }, []);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastDoc(null);
    setHasMore(true);
    try {
      const category = activeCategory === 'all' ? null : activeCategory;
      const page = await fetchUniqueArticles(category, PAGE_SIZE + FEATURED_COUNT, null, langFilter);

      const featured = page.articles.slice(0, FEATURED_COUNT);
      const gridArticles = page.articles.slice(FEATURED_COUNT);

      setFeaturedArticles(featured);
      setArticles(isBreakingView ? page.articles : gridArticles);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Unable to load stories. Please try again.');
    }
    setLoading(false);
  }, [activeCategory, langFilter, isBreakingView]);

  useEffect(() => {
    const queryCategory = searchParams.get('category');
    if (queryCategory === 'breaking') {
      setActiveCategory('breaking');
    } else if (!queryCategory) {
      setActiveCategory('all');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const category = activeCategory === 'all' ? null : activeCategory;
      const page = await fetchUniqueArticles(category, PAGE_SIZE, lastDoc, langFilter);
      setArticles(prev => {
        const existingSlugs = new Set([
          ...featuredArticles.map(a => a.slug),
          ...prev.map(a => a.slug),
        ]);
        const fresh = page.articles.filter(a => a.slug && !existingSlugs.has(a.slug));
        return [...prev, ...fresh];
      });
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Error loading more:', err);
      setError('Failed to load more stories.');
    }
    setLoadingMore(false);
  };

  return (
    <Layout>
      <OnboardingModal />

      {/* Zone 1 — Right Now: hero + 3 secondary stories */}
      {featuredArticles.length > 0 && !isBreakingView && (
        <HeroSection featured={featuredArticles} />
      )}

      {!isBreakingView && <NriRatesWidget />}

      {/* Zone 2 — Videos + For You carousel */}
      {!isBreakingView && <HomeVideoStrip />}
      {!isBreakingView && <PersonalizedCarousel />}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Zone 3 — Browse by Section */}
        {!isBreakingView && (
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">
              Browse by Section
            </h2>
            <SectionPreviews language={langFilter} />
          </div>
        )}

        <div className="sticky-section-header -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4 min-w-0">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3">
            {isBreakingView ? 'Breaking News' : 'Latest Stories'}
          </h2>
          <CategoryFilter
            onCategoryChange={setActiveCategory}
            activeCategory={activeCategory}
            categories={getHomeCategories()}
          />
        </div>

        <div className="min-w-0 w-full">
          {error && !loading && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center justify-between">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={fetchInitial} className="btn-ghost text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {!loading && !error && articles.length === 0 && featuredArticles.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No stories yet"
              description="Check back soon for the latest news from India and the GCC."
              actionLabel="Browse World News"
              actionTo="/world"
            />
          ) : (
            <NewsMasonryGrid articles={articles} loading={loading} showMobileNewsletter cardVariant="default" />
          )}

          {hasMore && articles.length > 0 && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary px-8 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Stories'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
