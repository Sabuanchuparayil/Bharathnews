import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const BreakingTicker = ({ articles = [] }) => {
  if (!articles.length) return null;

  return (
    <div className="bg-brand-950 dark:bg-brand-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-10">
        <div className="flex items-center space-x-2 mr-4 flex-shrink-0">
          <Zap className="w-4 h-4 text-accent-amber animate-pulse-soft" />
          <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">Breaking</span>
        </div>
        <div className="overflow-hidden flex-1">
          <motion.div
            animate={{ x: [0, -2000] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex items-center space-x-12 whitespace-nowrap"
          >
            {[...articles, ...articles].map((article, i) => (
              <Link
                key={i}
                to={`/article/${article.slug}`}
                className="text-sm text-gray-200 hover:text-white transition-colors"
              >
                {article.title}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BreakingTicker;
