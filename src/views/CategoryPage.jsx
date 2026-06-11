'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AdSlot from '../components/AdSlot';
import NewsMasonryGrid from '../components/NewsMasonryGrid';
import EmptyState from '../components/EmptyState';
import PageSidebar from '../components/PageSidebar';
import TrendingHeroBanner from '../components/TrendingHeroBanner';
import { Newspaper } from 'lucide-react';
import { getArticlesPage, getTrendingArticles } from '../services/firestore';

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
      getArticlesPage(category, null, PAGE_SIZE),
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
    const page = await getArticlesPage(category, lastDoc, PAGE_SIZE);
    setArticles(prev => [...prev, ...page.articles]);
    setLastDoc(page.lastDoc);
    setHasMore(page.hasMore);
    setLoadingMore(false);
  };

  const leadArticle = articles[0];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">{title}</h1>

        {!loading && leadArticle?.slug && (
          <div className="mb-8">
            <TrendingHeroBanner
              title={leadArticle.title}
              summary={leadArticle.summary}
              slug={leadArticle.slug}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {!loading && articles.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={`No ${title.toLowerCase()} yet`}
                description="Check back soon for the latest stories in this category."
                actionLabel="Back to Home"
                actionTo="/"
              />
            ) : (
              <NewsMasonryGrid articles={leadArticle ? articles.slice(1) : articles} loading={loading} />
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
