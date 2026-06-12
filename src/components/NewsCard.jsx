'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Heart, Bookmark, Eye, ChevronUp } from 'lucide-react';
import ShareButton from './ShareButton';
import Link from 'next/link';
import RelativeTime from './RelativeTime';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useInterests } from '../context/InterestContext';
import SafeImage from './SafeImage';
import QuickReadSheet from './QuickReadSheet';
import { getCategoryColor, getCategoryAccentBorder, getCategoryLabel } from '../utils/categoryColors';
import { decodeHtmlEntities } from '../utils/formatters';

const HeartBurst = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
        animate={{
          opacity: 0,
          scale: 1,
          x: Math.cos((i / 6) * Math.PI * 2) * 24,
          y: Math.sin((i / 6) * Math.PI * 2) * 24,
        }}
        transition={{ duration: 0.5 }}
        className="absolute w-2 h-2 text-accent-rose"
      >
        <Heart className="w-2 h-2 fill-current" />
      </motion.span>
    ))}
  </>
);

const NewsCard = ({ article, variant = 'default', index = 0 }) => {
  const { user, isBookmarked, isLiked, toggleBookmark, toggleLike } = useAuth();
  const { trackShare, trackBookmark } = useInterests();
  const [showBurst, setShowBurst] = useState(false);
  const [quickRead, setQuickRead] = useState(false);

  const {
    id,
    slug = '',
    imageUrl,
    publishedAt,
    author = 'The Bharath News',
    category = 'General',
    readTime = 3,
    views = 0,
    source = '',
  } = article;
  const title = decodeHtmlEntities(article.title || 'Untitled');
  const summary = decodeHtmlEntities(article.summary || '');

  const liked = id ? isLiked(id) : false;
  const bookmarked = id ? isBookmarked(id) : false;

  useEffect(() => {
    if (!showBurst) return;
    const t = setTimeout(() => setShowBurst(false), 600);
    return () => clearTimeout(t);
  }, [showBurst]);

  const handleBookmark = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!user) { toast.info('Sign in to bookmark'); return; }
    if (!id) return;
    const nowBookmarked = await toggleBookmark(id);
    trackBookmark(article);
    toast.success(nowBookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.info('Sign in to like articles'); return; }
    if (!id) return;
    const nowLiked = await toggleLike(id);
    if (nowLiked) setShowBurst(true);
  };

  if (variant === 'compact') {
    return (
      <div className={`border-l-4 ${getCategoryAccentBorder(category)}`}>
        <Link href={`/article/${slug}`} className="group flex space-x-4 p-3 rounded-2xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors">
          <SafeImage src={imageUrl} alt={title} category={category} width={80} height={80} sizes="80px" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${getCategoryColor(category)}`}>{getCategoryLabel(category)}</span>
            <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mt-0.5 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">{title}</h3>
            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
              <span>{source || author}</span>
              <span>{readTime}m read</span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  const isFeatured = variant === 'featured';
  const imageHeight = isFeatured ? 'h-56 sm:h-72' : 'h-48 sm:h-52';

  return (
    <>
      <article
        className={`glass-card-solid rounded-2xl overflow-hidden group card-lift border-l-4 ${getCategoryAccentBorder(category)} relative hover:-translate-y-1 transition-transform duration-200`}
      >

        <Link href={`/article/${slug}`}>
          <div className={`relative ${imageHeight} overflow-hidden`}>
            <SafeImage
              src={imageUrl}
              alt={title}
              category={category}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${getCategoryColor(category)}`}>
                {getCategoryLabel(category)}
              </span>
            </div>
            {isFeatured && (
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-bold uppercase bg-accent-amber/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                  Featured
                </span>
              </div>
            )}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickRead(true); }}
              className="md:hidden absolute bottom-3 right-3 touch-target bg-black/50 backdrop-blur-sm rounded-xl text-white"
              aria-label="Quick read preview"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="p-5">
            <h2 className={`font-display font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors leading-snug ${isFeatured ? 'text-xl' : 'text-lg'}`}>
              {title}
            </h2>
            <p className={`text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed ${isFeatured ? 'text-base line-clamp-3' : 'text-sm'}`}>
              {summary}
            </p>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-3 text-xs text-gray-400">
                <span className="font-medium text-gray-600 dark:text-gray-300">{source || author}</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <RelativeTime date={publishedAt} />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-between px-5 pb-4">
          <div className="flex items-center space-x-1">
            <div className="relative">
              <motion.button
                onClick={handleLike}
                whileTap={{ scale: 1.3 }}
                aria-label={liked ? 'Unlike article' : 'Like article'}
                className={`touch-target rounded-xl transition-colors ${liked ? 'text-accent-rose bg-red-50 dark:bg-red-950/30' : 'text-gray-400 hover:text-accent-rose hover:bg-red-50 dark:hover:bg-red-950/30'}`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              </motion.button>
              <AnimatePresence>{showBurst && <HeartBurst />}</AnimatePresence>
            </div>
            <ShareButton
              title={title}
              text={summary}
              path={`/article/${slug}`}
              contentType="article"
              size="sm"
              onShared={() => user && trackShare(article)}
            />
            <motion.button
              onClick={handleBookmark}
              whileTap={{ scale: 0.9 }}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
              className={`touch-target rounded-xl transition-colors ${bookmarked ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/30' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30'}`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{views > 999 ? `${(views/1000).toFixed(1)}K` : views}</span>
          </div>
        </div>
      </article>

      <QuickReadSheet article={quickRead ? article : null} onClose={() => setQuickRead(false)} />
    </>
  );
};

export default NewsCard;
