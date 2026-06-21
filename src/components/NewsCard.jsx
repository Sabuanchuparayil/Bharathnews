'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Heart, Bookmark, ChevronUp, ArrowRight } from 'lucide-react';
import ShareButton from './ShareButton';
import Link from 'next/link';
import RelativeTime from './RelativeTime';
import { articleDisplayDate } from '../utils/articleDates';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useInterests } from '../context/InterestContext';
import SafeImage from './SafeImage';
import QuickReadSheet from './QuickReadSheet';
import { getCategoryColor, getCategoryAccentBorder, getCategoryLabel } from '../utils/categoryColors';
import { decodeHtmlEntities } from '../utils/formatters';
import { isArticleRead, markArticleRead, estimateReadTime } from '../utils/readState';

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

const NewsCard = ({ article, variant = 'default', index = 0, isMostRead = false }) => {
  const { user, isBookmarked, isLiked, toggleBookmark, toggleLike } = useAuth();
  const { trackShare, trackBookmark } = useInterests();
  const [showBurst, setShowBurst] = useState(false);
  const [quickRead, setQuickRead] = useState(false);
  const [read, setRead] = useState(false);

  const {
    id,
    slug = '',
    imageUrl,
    publishedAt,
    author = 'The Bharath News',
    category = 'General',
    readTime: readTimeProp,
    source = '',
    views = 0,
  } = article;
  const displayDate = articleDisplayDate(article);
  const title = decodeHtmlEntities(article.title || 'Untitled');
  const summary = decodeHtmlEntities(article.summary || '');
  const readTime = readTimeProp || estimateReadTime(`${title} ${summary}`);

  const liked = id ? isLiked(id) : false;
  const bookmarked = id ? isBookmarked(id) : false;

  useEffect(() => {
    if (slug) setRead(isArticleRead(slug));
  }, [slug]);

  useEffect(() => {
    if (!showBurst) return;
    const t = setTimeout(() => setShowBurst(false), 600);
    return () => clearTimeout(t);
  }, [showBurst]);

  const handleArticleClick = () => {
    if (slug) {
      markArticleRead(slug);
      setRead(true);
    }
  };

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

  const readDimClass = read ? 'opacity-60 saturate-75' : '';

  const ReadMore = ({ className = '' }) => (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 group-hover:underline ${className}`}>
      Read more
      <ArrowRight className="w-3.5 h-3.5" />
    </span>
  );

  if (variant === 'compact') {
    return (
      <div className={`border-l-4 ${getCategoryAccentBorder(category)} ${readDimClass}`}>
        <Link href={`/article/${slug}`} onClick={handleArticleClick} className="group flex space-x-4 p-3 rounded-2xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors">
          <SafeImage src={imageUrl} alt={title} category={category} width={80} height={80} sizes="80px" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mt-0.5 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">{title}</h3>
            <div className="flex items-center justify-between mt-2 gap-2">
              <div className="flex items-center space-x-3 text-xs text-gray-400 min-w-0">
                <span className="truncate">{source || author}</span>
                <span>{readTime} min</span>
                <RelativeTime date={displayDate} />
              </div>
              <ReadMore className="flex-shrink-0 text-xs" />
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'scan') {
    return (
      <>
        <article className={`glass-card-solid rounded-2xl overflow-hidden group border-l-4 ${getCategoryAccentBorder(category)} hover:-translate-y-0.5 transition-all duration-200 ${readDimClass}`}>
          <Link href={`/article/${slug}`} onClick={handleArticleClick} className="flex gap-4 p-4">
            <SafeImage
              src={imageUrl}
              alt={title}
              category={category}
              width={96}
              height={96}
              sizes="96px"
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${getCategoryColor(category)}`}>
                  {getCategoryLabel(category)}
                </span>
                {isMostRead && (
                  <span className="text-[10px] font-bold uppercase bg-accent-amber/90 text-white px-1.5 py-0.5 rounded">
                    Most Read
                  </span>
                )}
                {read && <span className="text-[10px] text-gray-400">Read</span>}
              </div>
              <h2 className="font-display font-bold text-base text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors leading-snug">
                {title}
              </h2>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                <span className="font-medium text-gray-500 dark:text-gray-400 truncate">{source || author}</span>
                <span className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {readTime} min
                </span>
                <RelativeTime date={displayDate} />
              </div>
              <ReadMore className="mt-2" />
            </div>
          </Link>
          <div className="px-4 pb-3 flex items-center space-x-1 border-t border-gray-100 dark:border-gray-800 pt-2 mx-4">
            <motion.button
              onClick={handleLike}
              whileTap={{ scale: 1.2 }}
              aria-label={liked ? 'Unlike' : 'Like'}
              className={`touch-target rounded-lg text-sm ${liked ? 'text-accent-rose' : 'text-gray-400 hover:text-accent-rose'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
            </motion.button>
            <ShareButton title={title} text={summary} path={`/article/${slug}`} contentType="article" size="sm" />
            <motion.button
              onClick={handleBookmark}
              whileTap={{ scale: 0.9 }}
              aria-label="Bookmark"
              className={`touch-target rounded-lg ${bookmarked ? 'text-brand-600' : 'text-gray-400 hover:text-brand-600'}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
            </motion.button>
            <button
              onClick={(e) => { e.preventDefault(); setQuickRead(true); }}
              className="md:hidden ml-auto touch-target text-gray-400"
              aria-label="Quick read"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </article>
        <QuickReadSheet article={quickRead ? article : null} onClose={() => setQuickRead(false)} />
      </>
    );
  }

  const isFeatured = variant === 'featured';
  const imageHeight = isFeatured ? 'h-56 sm:h-72' : 'h-48 sm:h-52';
  const showSummary = isFeatured;

  return (
    <>
      <article
        className={`glass-card-solid rounded-2xl overflow-hidden group card-lift border-l-4 ${getCategoryAccentBorder(category)} relative hover:-translate-y-1 transition-transform duration-200 ${readDimClass}`}
      >
        <Link href={`/article/${slug}`} onClick={handleArticleClick}>
          <div className={`relative ${imageHeight} overflow-hidden`}>
            <SafeImage
              src={imageUrl}
              alt={title}
              category={category}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${getCategoryColor(category)}`}>
                {getCategoryLabel(category)}
              </span>
              {isMostRead && (
                <span className="text-[10px] font-bold uppercase bg-accent-amber/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                  Most Read
                </span>
              )}
            </div>
            {isFeatured && (
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-bold uppercase bg-accent-amber/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                  Featured
                </span>
              </div>
            )}
            {read && (
              <div className="absolute top-3 right-3">
                <span className="text-[10px] font-medium bg-black/50 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                  Read
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
            {showSummary && summary && (
              <p className="text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed text-base line-clamp-3">
                {summary}
              </p>
            )}
            {!showSummary && (
              <p className="hidden md:group-hover:block text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                {summary}
              </p>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 gap-3">
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 min-w-0">
                <span className="font-medium text-gray-600 dark:text-gray-300">{source || author}</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  {readTime} min
                </span>
                <RelativeTime date={displayDate} />
              </div>
              <ReadMore className="flex-shrink-0" />
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
        </div>
      </article>

      <QuickReadSheet article={quickRead ? article : null} onClose={() => setQuickRead(false)} />
    </>
  );
};

export default NewsCard;
