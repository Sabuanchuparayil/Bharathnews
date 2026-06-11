import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getTrendingArticles } from '../services/firestore';
import { useFocusTrap } from '../hooks/useFocusTrap';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [articles, setArticles] = useState([]);
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) getTrendingArticles(6).then(setArticles).catch(() => setArticles([]));
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55]"
            onClick={onClose}
          />
          <motion.div
            ref={trapRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-16 right-4 w-80 sm:w-96 glass-card-solid rounded-2xl shadow-floating border border-gray-100 dark:border-gray-800 z-[60] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">Breaking & Trending</h3>
              </div>
              <button onClick={onClose} aria-label="Close notifications" className="p-1.5 hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {articles.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">No notifications yet</p>
              ) : (
                articles.map((article, i) => (
                  <Link
                    key={article.id || i}
                    to={`/article/${article.slug}`}
                    onClick={onClose}
                    className="flex items-start space-x-3 p-4 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                  >
                    <Zap className="w-4 h-4 text-accent-amber flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{article.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt?.seconds ? article.publishedAt.seconds * 1000 : article.publishedAt), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
