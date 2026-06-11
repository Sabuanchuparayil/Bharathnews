import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import ShareButton from './ShareButton';

const TrendingHeroBanner = ({ title, summary, slug }) => (
  <section className="relative gradient-hero text-white py-16 sm:py-20 overflow-hidden rounded-3xl mx-4 sm:mx-6 max-w-7xl lg:mx-auto">
    <div className="relative z-10 px-6 sm:px-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-accent-amber" />
          <span className="text-xs font-bold uppercase tracking-wider text-accent-amber">Trending Now</span>
        </div>
        {slug && (
          <ShareButton
            title={title}
            text={summary}
            path={`/article/${slug}`}
            contentType="article"
            size="sm"
            className="[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10"
          />
        )}
      </div>
      <h2 className="font-display font-bold text-2xl sm:text-4xl leading-tight text-balance mb-4">{title}</h2>
      {summary && <p className="text-brand-200 text-lg max-w-2xl line-clamp-2 mb-6">{summary}</p>}
      {slug && (
        <Link to={`/article/${slug}`} className="btn-primary inline-flex bg-white text-brand-700 hover:bg-brand-50">
          Read Full Story
        </Link>
      )}
    </div>
  </section>
);

export default TrendingHeroBanner;
