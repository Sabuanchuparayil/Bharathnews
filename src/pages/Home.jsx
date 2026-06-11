import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import HeroSection from '../components/HeroSection';
import BreakingTicker from '../components/BreakingTicker';
import ForYouSection from '../components/ForYouSection';
import NewsCard from '../components/NewsCard';
import CategoryFilter from '../components/CategoryFilter';
import TrendingSection from '../components/TrendingSection';
import ChannelFollowCTA from '../components/ChannelFollowCTA';
import NewsletterSignup from '../components/NewsletterSignup';
import AdSlot from '../components/AdSlot';
import ChatbotWidget from '../components/ChatbotWidget';
import { getArticles, getTrendingArticles } from '../services/firestore';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allArticles, trending] = await Promise.all([
          getArticles(activeCategory === 'all' ? null : activeCategory),
          getTrendingArticles(5),
        ]);
        setFeaturedArticles(allArticles.slice(0, 4));
        setArticles(allArticles.slice(4));
        setTrendingArticles(trending);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <Header />
      <BreakingTicker articles={trendingArticles} />

      <main className="pb-20 md:pb-0">
        <HeroSection featured={featuredArticles} />

        <ForYouSection />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <CategoryFilter onCategoryChange={setActiveCategory} activeCategory={activeCategory} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass-card-solid rounded-2xl overflow-hidden">
                      <div className="h-48 skeleton" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 skeleton w-1/4" />
                        <div className="h-5 skeleton w-3/4" />
                        <div className="h-4 skeleton w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {articles.map((article, index) => (
                    <NewsCard key={article.id} article={article} index={index} />
                  ))}
                </div>
              )}

              <AdSlot className="my-8" />

              <div className="text-center mt-8">
                <button className="btn-secondary px-8">
                  Load More Stories
                </button>
              </div>
            </div>

            <aside className="space-y-6 hidden lg:block">
              <TrendingSection articles={trendingArticles} />
              <ChannelFollowCTA />
              <AdSlot />
              <NewsletterSignup />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
      <ChatbotWidget />
    </div>
  );
};

export default Home;
