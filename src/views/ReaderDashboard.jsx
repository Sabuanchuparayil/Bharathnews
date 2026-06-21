'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Heart, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { getArticlesByIds, getBookmarks } from '../services/articles';
import { getCategoryLabel } from '../utils/categoryColors';

const ReaderDashboard = () => {
  const { user, userProfile, loading, loginWithGoogle } = useAuth();
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);

  useEffect(() => {
    if (user) {
      getBookmarks(user.uid).then(ids => {
        if (ids.length) getArticlesByIds(ids).then(setBookmarkedArticles);
      });
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          icon={TrendingUp}
          title="Your personal dashboard"
          description="Sign in to track bookmarks, interests, and reading habits."
          actionLabel="Sign in with Google"
          onAction={loginWithGoogle}
        />
      </Layout>
    );
  }

  const interests = userProfile?.interests?.categories || {};
  const topCategories = Object.entries(interests).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <Layout mainClassName="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Your Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Personalized news based on your reading habits</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card-solid rounded-2xl p-4 text-center">
          <Bookmark className="w-5 h-5 text-brand-600 dark:text-brand-400 mx-auto mb-2" />
          <p className="font-bold text-2xl text-gray-900 dark:text-white">{userProfile?.bookmarks?.length || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Bookmarks</p>
        </div>
        <div className="glass-card-solid rounded-2xl p-4 text-center">
          <Heart className="w-5 h-5 text-accent-rose mx-auto mb-2" />
          <p className="font-bold text-2xl text-gray-900 dark:text-white">{userProfile?.likes?.length || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Liked</p>
        </div>
        <div className="glass-card-solid rounded-2xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-accent-emerald mx-auto mb-2" />
          <p className="font-bold text-2xl text-gray-900 dark:text-white">{topCategories.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Interest Topics</p>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3">Your Interests</h2>
          <div className="flex flex-wrap gap-2">
            {topCategories.map(([cat, score]) => (
              <Link key={cat} href={`/${cat === 'realestate' ? 'real-estate' : cat}`}
                className="px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-sm font-medium">
                {getCategoryLabel(cat)} ({Math.round(score * 100)}%)
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-4">Saved Articles</h2>
      {bookmarkedArticles.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved articles"
          description="Bookmark stories from the feed to see them here."
          actionLabel="Browse news"
          actionTo="/"
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bookmarkedArticles.map((a, i) => <NewsCard key={a.id} article={a} index={i} variant="compact" />)}
        </div>
      )}
    </Layout>
  );
};

export default ReaderDashboard;
