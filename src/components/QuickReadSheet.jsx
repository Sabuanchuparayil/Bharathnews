'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import SafeImage from './SafeImage';
import ShareButton from './ShareButton';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';

const QuickReadSheet = ({ article, onClose }) => {
  if (!article) return null;

  const publishedDate = article.publishedAt?.seconds
    ? article.publishedAt.seconds * 1000
    : article.publishedAt;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] md:hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-surface-1 rounded-t-3xl max-h-[75vh] overflow-y-auto safe-bottom"
          role="dialog"
          aria-modal="true"
          aria-label="Quick read preview"
        >
          <div className="sticky top-0 bg-white dark:bg-dark-surface-1 px-4 py-3 flex justify-center border-b border-gray-100 dark:border-gray-800">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          <div className="p-5">
            <button onClick={onClose} aria-label="Close preview" className="absolute top-4 right-4 p-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2">
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <SafeImage
              src={article.imageUrl}
              alt={article.title}
              category={article.category}
              width={400}
              height={160}
              sizes="(max-width: 640px) 100vw, 400px"
              className="w-full h-40 object-cover rounded-2xl mb-4"
            />
            <span className={`inline-block text-xs font-semibold uppercase px-2.5 py-1 rounded-full mb-3 ${getCategoryColor(article.category)}`}>
              {getCategoryLabel(article.category)}
            </span>
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white leading-snug mb-2">{article.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 mb-4">{article.summary}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mb-5">
              <Clock className="w-3.5 h-3.5" />
              <span>{publishedDate ? formatDistanceToNow(new Date(publishedDate), { addSuffix: true }) : ''}</span>
              <span>·</span>
              <span>{article.readTime || 3}m read</span>
            </div>
            <div className="flex items-center gap-3">
              <ShareButton
                title={article.title}
                text={article.summary}
                path={`/article/${article.slug}`}
                contentType="article"
                showLabel
                className="flex-shrink-0"
              />
              <Link href={`/article/${article.slug}`}
                onClick={onClose}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <span>Read Full Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickReadSheet;
