import React from 'react';
import { TrendingUp, Play } from 'lucide-react';
import { toast } from 'react-toastify';

const TrendingHeroBanner = () => {
  const trendingStory = {
    title: "India's Digital Economy Surges to $1 Trillion Valuation in 2025",
    summary: "Tech sector growth accelerates with record investments and global partnerships driving innovation.",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop",
    publishedAt: new Date('2025-10-15T12:00:00Z'),
    views: 245600,
    category: "Business"
  };

  const handleReadFullStory = () => {
    toast.info('Full story page coming soon! In the meantime, check out our latest articles.');
  };

  return (
    <section className="relative bg-gradient-to-r from-indigo-900 to-indigo-700 text-white py-20 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${trendingStory.imageUrl})` }}></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <span className="font-display font-semibold text-emerald-400">Trending Now</span>
        </div>
        
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 leading-tight text-shadow-lg">
          {trendingStory.title}
        </h1>
        
        <p className="text-xl text-indigo-100 mb-6 max-w-2xl text-shadow">
          {trendingStory.summary}
        </p>
        
        <div className="flex items-center space-x-6 mb-8">
          <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {trendingStory.category}
          </span>
          <span className="text-indigo-200">
            {trendingStory.views.toLocaleString()} views
          </span>
        </div>
        
        <button 
          onClick={handleReadFullStory}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <Play className="w-5 h-5" />
          <span>Read Full Story</span>
        </button>
      </div>
    </section>
  );
};

export default TrendingHeroBanner;