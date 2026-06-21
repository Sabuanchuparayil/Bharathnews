'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Zap } from 'lucide-react';
import Link from 'next/link';
import RelativeTime from './RelativeTime';
import { articleDisplayDate } from '@/utils/articleDates';
import { useFocusTrap } from '../hooks/useFocusTrap';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setLoading(true);
    import('../services/articles')
      .then(({ getTrendingArticles }) => getTrendingArticles(6))
      .then((data) => { if (!cancelled) setArticles(data); })
      .catch(() => { if (!cancelled) setArticles([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={trapRef}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:top-16 sm:right-4 sm:bottom-auto w-full sm:w-96 glass-card-solid rounded-t-2xl sm:rounded-2xl shadow-floating border border-gray-100 dark:border-gray-800 z-[60] overflow-hidden safe-bottom"
            role="dialog"
            aria-modal="true"
            aria-label="Trending stories"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">Trending Now</h3>
              </div>
              <button onClick={onClose} aria-label="Close trending panel" className="touch-target hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 skeleton rounded-xl" />
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">No trending stories yet</p>
              ) : (
                articles.map((article, i) => (
                  <Link
                    key={article.id || i}
                    href={`/article/${article.slug}`}
                    onClick={onClose}
                    className="flex items-start space-x-3 p-4 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0 min-h-[44px]"
                  >
                    <Zap className="w-4 h-4 text-accent-amber flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{article.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <RelativeTime date={articleDisplayDate(article)} fallback="Just now" />
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
