'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Newspaper, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import StoriesCarousel from '../components/StoriesCarousel';
import NriRatesWidget from '../components/NriRatesWidget';
import HomeVideoStrip from '../components/HomeVideoStrip';
import PersonalizedCarousel from '../components/PersonalizedCarousel';
import SectionPreviews from '../components/SectionPreviews';
import CategoryFilter from '../components/CategoryFilter';
import SubcategoryFilter from '../components/SubcategoryFilter';
import OnboardingModal from '../components/OnboardingModal';
import EmptyState from '../components/EmptyState';
import NewsMasonryGrid from '../components/NewsMasonryGrid';
import { getHomeCategories } from '../config/feeds.config';
import { toFirestoreLanguageFilter } from '@/config/languages.config';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchUniqueArticles,
  fetchUniqueArticlesForSection,
  getMostReadArticles,
  getArticlesByInterests,
  getTrendingArticles,
} from '../services/articles';
import { updateLastVisitTime } from '../utils/readState';

const PAGE_SIZE = 12;
const FEATURED_COUNT = 4;

const Home = () => {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { user, userProfile } = useAuth();
  const langFilter = toFirestoreLanguageFilter(language);
  const urlSub = searchParams.get('sub');
  const urlCategory = searchParams.get('category');
  const activeSub = urlSub || (urlCategory === 'breaking' ? 'breaking' : 'all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [carouselArticles, setCarouselArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const isBreakingView = activeSub === 'breaking' || activeCategory === 'breaking';
  const isTopStoriesSubView = activeSub && activeSub !== 'all';
  const showHomeSections = !isBreakingView && !isTopStoriesSubView;

  useEffect(() => {
    updateLastVisitTime();
  }, []);

  const loadArticlesForView = useCallback(async (startAfterDoc = null, pageSize = PAGE_SIZE) => {
    if (activeSub === 'for-you') {
      const interests = userProfile?.interests;
      if (user && interests?.categories && Object.keys(interests.categories).length > 0) {
        const personalized = await getArticlesByInterests(interests, pageSize + FEATURED_COUNT, langFilter);
        if (personalized.length) {
          return {
            articles: personalized,
            lastDoc: null,
            hasMore: false,
          };
        }
      }
      const trending = await getTrendingArticles(pageSize + FEATURED_COUNT, langFilter);
      return { articles: trending, lastDoc: null, hasMore: false };
    }

    if (activeSub === 'most-read') {
      const mostRead = await getMostReadArticles(pageSize + FEATURED_COUNT, langFilter);
      return { articles: mostRead, lastDoc: null, hasMore: false };
    }

    if (activeSub === 'breaking') {
      return fetchUniqueArticles('breaking', pageSize + FEATURED_COUNT, startAfterDoc, langFilter);
    }

    if (activeSub && activeSub !== 'all') {
      return fetchUniqueArticlesForSection('top-stories', activeSub, pageSize + FEATURED_COUNT, startAfterDoc, langFilter);
    }

    const category = activeCategory === 'all' ? null : activeCategory;
    return fetchUniqueArticles(category, pageSize + FEATURED_COUNT, startAfterDoc, langFilter);
  }, [activeSub, activeCategory, langFilter, user, userProfile]);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastDoc(null);
    setHasMore(true);
    try {
      const page = await loadArticlesForView(null, PAGE_SIZE + FEATURED_COUNT);

      const featured = showHomeSections ? page.articles.slice(0, FEATURED_COUNT) : [];
      const gridArticles = showHomeSections
        ? page.articles.slice(FEATURED_COUNT)
        : page.articles;

      setFeaturedArticles(featured);
      setCarouselArticles(showHomeSections ? page.articles.slice(0, 12) : []);
      setArticles(isBreakingView ? page.articles : gridArticles);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Unable to load stories. Please try again.');
    }
    setLoading(false);
  }, [loadArticlesForView, isBreakingView, showHomeSections]);

  useEffect(() => {
    if (urlCategory === 'breaking' && !urlSub) {
      setActiveCategory('breaking');
    } else if (!urlSub && !urlCategory) {
      setActiveCategory('all');
    }
  }, [searchParams, urlCategory, urlSub]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const page = await loadArticlesForView(lastDoc, PAGE_SIZE);
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

  const sectionTitle = (() => {
    if (activeSub === 'breaking') return 'Breaking News';
    if (activeSub === 'most-read') return 'Most Read';
    if (activeSub === 'for-you') return 'For You';
    if (activeSub === 'editors-picks') return "Editor's Picks";
    if (isTopStoriesSubView) return 'Top Stories';
    return 'Latest Stories';
  })();

  return (
    <Layout>
      <h1 className="sr-only">The Bharath News — Breaking News from India &amp; GCC</h1>
      <OnboardingModal />

      {/* Zone 1 — Right Now: hero + 3 secondary stories */}
      {featuredArticles.length > 0 && showHomeSections && (
        <HeroSection featured={featuredArticles} />
      )}

      {showHomeSections && carouselArticles.length >= 3 && (
        <StoriesCarousel articles={carouselArticles} />
      )}

      {showHomeSections && <NriRatesWidget />}

      {/* Zone 2 — Videos + For You carousel */}
      {showHomeSections && <HomeVideoStrip />}
      {showHomeSections && <PersonalizedCarousel />}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Zone 3 — Browse by Section */}
        {showHomeSections && (
          <div className="mb-12">
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">
              Browse by Section
            </h2>
            <SectionPreviews language={langFilter} />
          </div>
        )}

        <div className="sticky-section-header -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-4 min-w-0">
          {!showHomeSections && (
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white mb-3">
              {sectionTitle}
            </h1>
          )}
          {showHomeSections && (
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3">
              {sectionTitle}
            </h2>
          )}
          <div className="mb-3">
            <SubcategoryFilter sectionId="top-stories" activeSubcategory={activeSub} basePath="/" />
          </div>
          {showHomeSections && (
            <CategoryFilter
              onCategoryChange={setActiveCategory}
              activeCategory={activeCategory}
              categories={getHomeCategories()}
            />
          )}
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
