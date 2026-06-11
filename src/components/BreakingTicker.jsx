import React, { useRef, useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const BreakingTicker = ({ articles = [] }) => {
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (trackRef.current) {
      const width = trackRef.current.scrollWidth / 2;
      const pixelsPerSecond = 60;
      setDuration(Math.max(width / pixelsPerSecond, 15));
    }
  }, [articles]);

  if (!articles.length) return null;

  const items = [...articles, ...articles];

  return (
    <div className="bg-brand-950 dark:bg-brand-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-10">
        <div className="flex items-center space-x-2 mr-4 flex-shrink-0">
          <Zap className="w-4 h-4 text-accent-amber animate-pulse-soft" />
          <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">Breaking</span>
          <span className="hidden sm:inline text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
            {articles.length} live
          </span>
        </div>
        <div className="overflow-hidden flex-1">
          <div
            ref={trackRef}
            className="ticker-track items-center space-x-12 whitespace-nowrap"
            style={{ '--ticker-duration': `${duration}s` }}
          >
            {items.map((article, i) => (
              <Link
                key={`${article.slug}-${i}`}
                to={`/article/${article.slug}`}
                className="text-sm text-gray-200 hover:text-white transition-colors inline-block"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingTicker;
