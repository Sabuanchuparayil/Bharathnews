'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, AlertCircle, TrendingUp, Copy, CheckCircle,
  Zap, BarChart3, Eye, Heart, ExternalLink, ChevronDown, ChevronUp,
  Flame, ArrowUpRight, Calendar, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getSmartPostSuggestions, getOptimalPostingTimes, logSocialPost } from '../services/socialIntelligence';
import { getCategoryLabel } from '../utils/categoryColors';

const PLATFORM_ICONS = {
  telegram: { label: 'Telegram', color: 'bg-sky-500', textColor: 'text-sky-600' },
  whatsapp: { label: 'WhatsApp', color: 'bg-green-500', textColor: 'text-green-600' },
  facebook: { label: 'Facebook', color: 'bg-blue-600', textColor: 'text-blue-600' },
  twitter: { label: 'Twitter/X', color: 'bg-gray-900 dark:bg-white', textColor: 'text-gray-900 dark:text-white' },
  instagram: { label: 'Instagram', color: 'bg-gradient-to-br from-purple-600 to-pink-500', textColor: 'text-pink-600' },
};

const TIER_CONFIG = {
  viral: { icon: Flame, label: 'Viral', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  trending: { icon: TrendingUp, label: 'Trending', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  rising: { icon: ArrowUpRight, label: 'Rising', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  standard: { icon: BarChart3, label: 'Standard', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
};

const PostSuggestionCard = ({ suggestion, onPost }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(
    suggestion.recommendedPlatforms.filter(p => p.priority === 'high').map(p => p.platform)
  );
  const [copiedPlatform, setCopiedPlatform] = useState(null);

  const tierConfig = TIER_CONFIG[suggestion.tier];
  const TierIcon = tierConfig.icon;
  const article = suggestion.article;

  const handleCopy = (platform) => {
    const text = suggestion.generatedPosts[platform];
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
    toast.success(`Copied ${PLATFORM_ICONS[platform].label} post!`);
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-solid rounded-2xl overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tierConfig.bg} ${tierConfig.color}`}>
                <TierIcon className="w-3 h-3" />
                {tierConfig.label}
              </span>
              <span className="text-xs text-gray-400">Score: {Math.round(suggestion.trendScore)}</span>
            </div>
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white line-clamp-2">{article.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(article.views || 0).toLocaleString()}</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{article.likes || 0}</span>
              <span>{getCategoryLabel(article.category)}</span>
            </div>
          </div>
          {article.imageUrl && (
            <img src={article.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recommended platforms:</p>
          <div className="flex flex-wrap gap-2">
            {suggestion.recommendedPlatforms.map(rec => (
              <button
                key={rec.platform}
                onClick={() => togglePlatform(rec.platform)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPlatforms.includes(rec.platform)
                    ? `${PLATFORM_ICONS[rec.platform].color} text-white`
                    : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400'
                }`}
                title={rec.reason}
              >
                <span>{PLATFORM_ICONS[rec.platform].label}</span>
                {rec.priority === 'high' && <Zap className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-xs text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 transition-colors"
        >
          {expanded ? 'Hide' : 'Preview'} generated posts
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {Object.entries(suggestion.generatedPosts)
                .filter(([platform]) => selectedPlatforms.includes(platform))
                .map(([platform, text]) => (
                  <div key={platform} className="rounded-xl bg-surface-2 dark:bg-dark-surface-2 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${PLATFORM_ICONS[platform].textColor}`}>
                        {PLATFORM_ICONS[platform].label}
                      </span>
                      <button
                        onClick={() => handleCopy(platform)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors"
                      >
                        {copiedPlatform === platform ? <CheckCircle className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPlatform === platform ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">{text}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{text.length} characters</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 pb-4 flex items-center gap-2">
        <button
          onClick={() => onPost(article, selectedPlatforms)}
          disabled={selectedPlatforms.length === 0}
          className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          Post to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
        </button>
        <a
          href={`/article/${article.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          View
        </a>
      </div>
    </motion.div>
  );
};

const SocialMediaPosting = () => {
  const { user, isContentWriter, isAdmin } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postingTimes, setPostingTimes] = useState([]);

  const canPost = isContentWriter || isAdmin;

  useEffect(() => {
    if (!canPost) { setLoading(false); return; }
    Promise.all([
      getSmartPostSuggestions(5),
    ]).then(([suggs]) => {
      setSuggestions(suggs);
      setPostingTimes(getOptimalPostingTimes());
    }).catch(err => {
      console.error('Failed to load suggestions:', err);
    }).finally(() => setLoading(false));
  }, [canPost]);

  const handlePost = async (article, platforms) => {
    if (!user) return;
    try {
      await logSocialPost(article.id, platforms, user.uid);
      toast.success(`Posted to ${platforms.map(p => PLATFORM_ICONS[p].label).join(', ')}!`);
    } catch (err) {
      console.error('Post logging failed:', err);
      toast.error('Failed to log post. Content was copied — post manually.');
    }
  };

  if (!canPost) {
    return (
      <div className="glass-card-solid rounded-2xl p-6 border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-accent-amber" />
          <div>
            <h3 className="font-display font-semibold text-gray-900 dark:text-white">Content Writer Access Required</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
              Social media posting is restricted to content writers and admins.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-amber" />
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Smart Posting</h2>
        </div>
        <span className="text-xs text-gray-400">Smart recommendations</span>
      </div>

      <div className="glass-card-solid rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">Best Posting Windows (India-GCC)</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {postingTimes.map((window, i) => (
            <div key={i} className={`rounded-xl p-3 text-center ${
              window.quality === 'highest' ? 'bg-brand-50 dark:bg-brand-950/30 ring-1 ring-brand-200 dark:ring-brand-800'
              : 'bg-surface-2 dark:bg-dark-surface-2'
            }`}>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{window.time.split('/')[0].trim()}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{window.label}</p>
              {window.quality === 'highest' && (
                <span className="inline-block mt-1 text-[9px] font-bold text-brand-600 dark:text-brand-400 uppercase">Peak</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card-solid rounded-2xl p-5">
              <div className="h-4 skeleton w-1/4 mb-3" />
              <div className="h-5 skeleton w-3/4 mb-2" />
              <div className="h-3 skeleton w-1/2" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No articles available for posting suggestions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion, i) => (
            <PostSuggestionCard
              key={suggestion.article.id || i}
              suggestion={suggestion}
              onPost={handlePost}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialMediaPosting;
