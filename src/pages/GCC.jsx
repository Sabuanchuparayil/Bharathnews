import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import NewsCard from '../components/NewsCard';
import ChatbotWidget from '../components/ChatbotWidget';
import AdSlot from '../components/AdSlot';
import { getArticles } from '../services/firestore';

const PAGE_CATEGORY = 'gcc';
const PAGE_TITLE = 'GCC News';

const GCC = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticles(PAGE_CATEGORY).then(data => {
      setArticles(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">{PAGE_TITLE}</h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card-solid rounded-2xl overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-5 space-y-3"><div className="h-5 skeleton w-3/4" /><div className="h-4 skeleton w-full" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <NewsCard key={article.id} article={article} index={i} />
            ))}
          </div>
        )}

        <AdSlot className="mt-8" />
      </main>
      <Footer />
      <BottomNav />
      <ChatbotWidget />
    </div>
  );
};

export default GCC;
