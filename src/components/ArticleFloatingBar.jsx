import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Heart } from 'lucide-react';
import ShareButton from './ShareButton';

const ArticleFloatingBar = ({ shareTitle, shareText, sharePath, onBookmark, likes = 0 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="flex items-center space-x-1 glass-card-solid rounded-2xl px-2 py-2 shadow-floating border border-gray-100 dark:border-gray-800">
            <ShareButton
              title={shareTitle}
              text={shareText}
              path={sharePath}
              contentType="article"
              size="sm"
            />
            <button
              onClick={onBookmark}
              aria-label="Bookmark article"
              className="btn-ghost p-2.5 rounded-xl text-gray-600 dark:text-gray-300"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1 px-3 text-xs text-gray-500 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800">
              <Heart className="w-3.5 h-3.5" />
              <span>{likes}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArticleFloatingBar;
