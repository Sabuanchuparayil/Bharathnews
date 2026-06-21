'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '../components/Layout';
import AdSlot from '../components/AdSlot';
import NewsMasonryGrid from '../components/NewsMasonryGrid';
import EmptyState from '../components/EmptyState';
import PageSidebar from '../components/PageSidebar';
import MobileSidebarExtras from '../components/MobileSidebarExtras';
import TrendingHeroBanner from '../components/TrendingHeroBanner';
import SubcategoryFilter from '../components/SubcategoryFilter';
import LiveSportsWidget from '../components/LiveSportsWidget';
import { Newspaper } from 'lucide-react';
import { fetchUniqueArticlesForSection, fetchUniqueArticles, getTrendingArticles } from '../services/articles';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';
import { getSection, resolveLegacyCategory, CATEGORY_ROUTES } from '../config/feeds.config';

const PAGE_SIZE = 12;

/**
 * Unified section/category page with subcategory pill strip.
 * Supports new section routes (sectionId) and legacy category routes (category).
 */
const SectionPage = ({
  sectionId: sectionIdProp,
  category: legacyCategory,
  title: titleProp,
  defaultSubcategory,
  layoutVariant = 'default',
}) => {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const langFilter = toFirestoreLanguageFilter(language);

  const resolved = sectionIdProp
    ? { sectionId: sectionIdProp, subcategoryId: defaultSubcategory || 'all' }
    : legacyCategory === 'breaking'
      ? { sectionId: 'top-stories', subcategoryId: 'breaking' }
      : resolveLegacyCategory(legacyCategory);

  const sectionId = resolved.sectionId || sectionIdProp;
  const section = sectionId ? getSection(sectionId) : null;
  const title = titleProp || section?.title || 'News';
  const basePath = (legacyCategory && CATEGORY_ROUTES[legacyCategory]?.path)
    || section?.path
    || '/';

  const routeMeta = legacyCategory ? CATEGORY_ROUTES[legacyCategory] : null;
  const urlSub = searchParams.get('sub');
  const activeSub = urlSub
    ?? defaultSubcategory
    ?? routeMeta?.subcategoryId
    ?? resolved.subcategoryId
    ?? 'all';

  const [articles, setArticles] = useState([]);
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLastDoc(null);
    setHasMore(true);

    const fetchArticles = legacyCategory === 'breaking' && !sectionIdProp
      ? fetchUniqueArticles('breaking', PAGE_SIZE, null, langFilter)
      : sectionId
        ? fetchUniqueArticlesForSection(sectionId, activeSub, PAGE_SIZE, null, langFilter)
        : fetchUniqueArticles(legacyCategory, PAGE_SIZE, null, langFilter);

    Promise.all([fetchArticles, getTrendingArticles(5, langFilter)]).then(([page, trending]) => {
      setArticles(page.articles);
      setLastDoc(page.lastDoc);
      setHasMore(page.hasMore);
      setTrendingArticles(trending);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sectionId, legacyCategory, activeSub, langFilter, sectionIdProp]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const page = legacyCategory === 'breaking' && !sectionIdProp
        ? await fetchUniqueArticles('breaking', PAGE_SIZE, lastDoc, langFilter)
        : sectionId
          ? await fetchUniqueArticlesForSection(sectionId, activeSub, PAGE_SIZE, lastDoc, langFilter)
          : await fetchUniqueArticles(legacyCategory, PAGE_SIZE, lastDoc, langFilter);

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
  const gridVariant = layoutVariant === 'life' ? 'magazine' : 'scan';
  const isLifeLayout = layoutVariant === 'life' || sectionId === 'life';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white mb-1">{title}</h1>
        {section?.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{section.description}</p>
        )}

        {sectionId && (
          <div className="mb-6">
            <SubcategoryFilter sectionId={sectionId} activeSubcategory={activeSub} basePath={basePath} />
          </div>
        )}

        {sectionId === 'money' && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">Markets</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Business, markets, jobs, and personal finance for the India-GCC diaspora.
            </p>
          </div>
        )}

        {sectionId === 'sports' && <LiveSportsWidget />}

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

        <div className={`grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 lg:gap-8 items-start ${isLifeLayout ? 'life-magazine-layout' : ''}`}>
          <div className="min-w-0 w-full">
            {!loading && articles.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={`No ${title.toLowerCase()} yet`}
                description="Check back soon for the latest stories in this section."
                actionLabel="Back to Home"
                actionTo="/"
              />
            ) : (
              <NewsMasonryGrid
                articles={leadArticle ? articles.slice(1) : articles}
                loading={loading}
                showMobileNewsletter
                cardVariant={gridVariant}
              />
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

          <PageSidebar trendingArticles={trendingArticles} category={legacyCategory || sectionId} />
        </div>
      </div>
    </Layout>
  );
};

export default SectionPage;
