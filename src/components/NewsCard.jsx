import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Heart, Share2, Bookmark, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useInterests } from '../context/InterestContext';

const NewsCard = ({ article, variant = 'default', index = 0 }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const { user } = useAuth();
  const { trackShare, trackBookmark } = useInterests();

  const {
    title = 'Untitled',
    summary = '',
    slug = '',
    imageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
    publishedAt,
    author = 'The Bharath News',
    category = 'General',
    readTime = 3,
    views = 0,
    source = '',
  } = article;

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/article/${slug}`;
    if (navigator.share) {
      await navigator.share({ title, text: summary, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
    if (user) trackShare(article);
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.info('Sign in to bookmark'); return; }
    setBookmarked(!bookmarked);
    trackBookmark(article);
    toast.success(bookmarked ? 'Removed from bookmarks' : 'Bookmarked!');
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
      >
        <Link to={`/article/${slug}`} className="group flex space-x-4 p-3 rounded-2xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors">
          <img src={imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" loading="lazy" />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{category}</span>
            <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mt-0.5 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">{title}</h3>
            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-400">
              <span>{source || author}</span>
              <span>{readTime}m read</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="glass-card-solid rounded-2xl overflow-hidden group"
    >
      <Link to={`/article/${slug}`}>
        <div className="relative h-48 sm:h-52 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span className="category-pill bg-white/90 dark:bg-dark-surface-1/90 text-brand-700 dark:text-brand-300 text-xs backdrop-blur-sm shadow-sm">
              {category}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="p-5">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors leading-snug">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
            {summary}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3 text-xs text-gray-400">
              <span className="font-medium text-gray-600 dark:text-gray-300">{source || author}</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{publishedAt ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true }) : ''}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between px-5 pb-4">
        <div className="flex items-center space-x-1">
          <button onClick={e => { e.preventDefault(); setLiked(!liked); }} className={`p-2 rounded-xl transition-colors ${liked ? 'text-accent-rose bg-red-50 dark:bg-red-950/30' : 'text-gray-400 hover:text-accent-rose hover:bg-red-50 dark:hover:bg-red-950/30'}`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          </button>
          <button onClick={handleShare} className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={handleBookmark} className={`p-2 rounded-xl transition-colors ${bookmarked ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/30' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30'}`}>
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Eye className="w-3.5 h-3.5" />
          <span>{views > 999 ? `${(views/1000).toFixed(1)}K` : views}</span>
        </div>
      </div>
    </motion.article>
  );
};

export default NewsCard;
