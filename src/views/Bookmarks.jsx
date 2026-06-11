'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { getBookmarks, getArticlesByIds } from '../services/firestore';

const Bookmarks = () => {
  const { user, loginWithGoogle } = useAuth();
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchBookmarks = async () => {
      try {
        const bookmarkIds = await getBookmarks(user.uid);
        const articles = await getArticlesByIds(bookmarkIds);
        setBookmarkedArticles(articles);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      }
      setLoading(false);
    };
    fetchBookmarks();
  }, [user]);

  return (
    <Layout mainClassName="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center space-x-2 mb-6">
        <BookmarkIcon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Bookmarks</h1>
      </div>
      {!user ? (
        <EmptyState
          icon={BookmarkIcon}
          title="Sign in to view bookmarks"
          description="Save articles to read later once you're signed in."
          actionLabel="Sign in with Google"
          onAction={loginWithGoogle}
        />
      ) : loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card-solid rounded-2xl overflow-hidden">
              <div className="h-32 skeleton" />
            </div>
          ))}
        </div>
      ) : bookmarkedArticles.length > 0 ? (
        <div className="space-y-6">
          {bookmarkedArticles.map((article, i) => <NewsCard key={article.id} article={article} index={i} />)}
        </div>
      ) : (
        <EmptyState
          icon={BookmarkIcon}
          title="No bookmarks yet"
          description="Tap the bookmark icon on any article to save it here."
          actionLabel="Browse news"
          actionTo="/"
        />
      )}
    </Layout>
  );
};

export default Bookmarks;
