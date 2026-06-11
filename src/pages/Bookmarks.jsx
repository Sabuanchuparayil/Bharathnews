import React, { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import { useAuth } from '../context/AuthContext';
import { getBookmarks, getArticlesByIds } from '../services/firestore';

const Bookmarks = () => {
  const { user } = useAuth();
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
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Please sign in to view your bookmarks.</p>
          <Link to="/settings" className="btn-primary inline-flex">Go to Settings</Link>
        </div>
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
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No bookmarked articles yet.</p>
        </div>
      )}
    </Layout>
  );
};

export default Bookmarks;
