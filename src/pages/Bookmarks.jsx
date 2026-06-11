import React, { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsCard from '../components/NewsCard';
import { useAuth } from '../context/AuthContext';
import { getBookmarks, getArticles } from '../services/firestore';

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
        const allArticles = await getArticles();
        setBookmarkedArticles(allArticles.filter(a => bookmarkIds.includes(a.id)));
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      }
      setLoading(false);
    };
    fetchBookmarks();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center space-x-2 mb-6">
          <BookmarkIcon className="w-8 h-8 text-brand-700" />
          <h1 className="font-display font-bold text-3xl text-gray-900">Bookmarks</h1>
        </div>
        {!user ? (
          <p className="text-gray-500 text-center">Please sign in to view your bookmarks.</p>
        ) : loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
        ) : bookmarkedArticles.length > 0 ? (
          <div className="space-y-6">
            {bookmarkedArticles.map(article => <NewsCard key={article.id} article={article} />)}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No bookmarked articles yet.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Bookmarks;
