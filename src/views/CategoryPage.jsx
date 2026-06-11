'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AdSlot from '../components/AdSlot';
import NewsMasonryGrid from '../components/NewsMasonryGrid';
import EmptyState from '../components/EmptyState';
import PageSidebar from '../components/PageSidebar';
import MobileSidebarExtras from '../components/MobileSidebarExtras';
import TrendingHeroBanner from '../components/TrendingHeroBanner';
import CategoryFilter from '../components/CategoryFilter';
import { Newspaper } from 'lucide-react';
import { fetchUniqueArticles, getTrendingArticles } from '../services/firestore';

const PAGE_SIZE = 12;

const CategoryPage = ({ category, title }) => {
  const [articles, setArticles] = useState([]);
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchUniqueArticles(category, PAGE_SIZE),
      getTrendingArticles(5),
    ]).then(([page, trending]) => {
      setArticles(page.articles);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setTrendingArticles(trending);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const page = await fetchUniqueArticles(category, PAGE_SIZE, lastDoc);
      setArticles(prev => {
        const existingSlugs = new Set(prev.map(a => a.slug));
        const fresh = page.articles.filter(a => a.slug && !existingSlugs.has(a.slug));
        return [...prev, ...fresh];
      });
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
    } catch {
      /* ignore */
    }
    setLoadingMore(false);
  };

  const leadArticle = articles[0];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white mb-4">{title}</h1>
        <div className="mb-6">
          <CategoryFilter showLabel edgeToEdge />
        </div>

        <MobileSidebarExtras trendingArticles={trendingArticles} />

        {!loading && leadArticle?.slug && (
          <div className="mb-8">
            <TrendingHeroBanner
              title={leadArticle.title}
              summary={leadArticle.summary}
              slug={leadArticle.slug}
              embedded
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 lg:gap-8 items-start">
          <div className="min-w-0 w-full">
            {!loading && articles.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={`No ${title.toLowerCase()} yet`}
                description="Check back soon for the latest stories in this category."
                actionLabel="Back to Home"
                actionTo="/"
              />
            ) : (
              <NewsMasonryGrid articles={leadArticle ? articles.slice(1) : articles} loading={loading} showMobileNewsletter />
            )}

            <AdSlot className="mt-8" />

            {hasMore && articles.length > 0 && (
              <div className="text-center mt-8">
                <button onClick={handleLoadMore} disabled={loadingMore} className="btn-secondary px-8 disabled:opacity-50">
                  {loadingMore ? 'Loading...' : 'Load More Stories'}
                </button>
              </div>
            )}
          </div>

          <PageSidebar trendingArticles={trendingArticles} category={category} />
        </div>
      </div>
    </Layout>
  );
};

export default CategoryPage;
