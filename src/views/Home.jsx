'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Newspaper, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import BreakingTicker from '../components/BreakingTicker';
import StoriesCarousel from '../components/StoriesCarousel';
import ForYouSection from '../components/ForYouSection';
import CategoryFilter from '../components/CategoryFilter';
import PageSidebar from '../components/PageSidebar';
import MobileSidebarExtras from '../components/MobileSidebarExtras';
import AdSlot from '../components/AdSlot';
import NewsMasonryGrid from '../components/NewsMasonryGrid';
import EmptyState from '../components/EmptyState';
import OnboardingModal from '../components/OnboardingModal';
import TrendingHeroBanner from '../components/TrendingHeroBanner';
import { getHomeCategories } from '../config/feeds.config';
import { getArticlesPage, getTrendingArticles } from '../services/firestore';

const PAGE_SIZE = 12;
const STORY_RING_COUNT = 12;

/** Deduplicate articles by slug, excluding any slugs in the exclude set */
function dedupeArticles(articles, excludeSlugs = new Set()) {
  const seen = new Set(excludeSlugs);
  return articles.filter(a => {
    if (!a?.slug || seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });
}

const Home = () => {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastDoc(null);
    setHasMore(true);
    try {
      const category = activeCategory === 'all' ? null : activeCategory;
      const [page, trending] = await Promise.all([
        getArticlesPage(category, null, (PAGE_SIZE + 4) * 3),
        getTrendingArticles(STORY_RING_COUNT + 4),
      ]);

      const featured = page.articles.slice(0, 4);
      const featuredSlugs = new Set(featured.map(a => a.slug));
      const gridArticles = page.articles.slice(4).filter(a => !featuredSlugs.has(a.slug));

      setFeaturedArticles(featured);
      setArticles(gridArticles);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setTrendingArticles(dedupeArticles(trending, featuredSlugs).slice(0, STORY_RING_COUNT));
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Unable to load stories. Please try again.');
    }
    setLoading(false);
  }, [activeCategory]);

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
      const page = await getArticlesPage(category, lastDoc, PAGE_SIZE);
      setArticles(prev => [...prev, ...page.articles]);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Error loading more:', err);
      setError('Failed to load more stories.');
    }
    setLoadingMore(false);
  };

  const showFallbackHero = !loading && featuredArticles.length === 0 && trendingArticles[0];

  return (
    <Layout>
      <OnboardingModal />
      <BreakingTicker articles={trendingArticles} />
      <StoriesCarousel articles={trendingArticles} />
      <MobileSidebarExtras trendingArticles={trendingArticles} />
      {featuredArticles.length > 0 ? (
        <HeroSection featured={featuredArticles} />
      ) : showFallbackHero ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <TrendingHeroBanner
            title={trendingArticles[0].title}
            summary={trendingArticles[0].summary}
            slug={trendingArticles[0].slug}
          />
        </div>
      ) : null}
      <ForYouSection />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="sticky-section-header -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4 min-w-0">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3">Latest Stories</h2>
          <CategoryFilter
            onCategoryChange={setActiveCategory}
            activeCategory={activeCategory}
            categories={getHomeCategories()}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 lg:gap-8 items-start">
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
                actionLabel="Browse India News"
                actionTo="/india"
              />
            ) : (
              <NewsMasonryGrid articles={articles} loading={loading} showMobileNewsletter />
            )}

            <AdSlot className="my-8" />

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

          <PageSidebar trendingArticles={trendingArticles} />
        </div>
      </div>
    </Layout>
  );
};

export default Home;
