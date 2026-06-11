import React, { useMemo } from 'react';
import TrendingSection from './TrendingSection';
import WeatherMarketWidget from './WeatherMarketWidget';
import ChannelFollowCTA from './ChannelFollowCTA';
import NewsletterSignup from './NewsletterSignup';
import AdSlot from './AdSlot';
import VideoColumn from './VideoColumn';
import RSSFeed from './RSSFeed';
import AdvertorialBanner from './AdvertorialBanner';
import { useVideos } from '../hooks/useVideos';
import { getFeedForCategory } from '../config/feeds.config';

const SPONSORED_AD = {
  title: 'GCC Business Summit 2026',
  description: 'Connect with leaders across India and the Gulf. Register for early-bird access.',
  imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop',
  link: 'https://thebharathnews.com',
  sponsoredBy: 'Bharath Events',
};

const PageSidebar = ({ trendingArticles = [], category = null }) => {
  const { videos } = useVideos('all');
  const categoryVideos = useMemo(() => {
    const filtered = category
      ? videos.filter(v => v.category === category)
      : videos;
    return filtered.slice(0, 4);
  }, [videos, category]);

  const rssFeed = category ? getFeedForCategory(category) : null;

  return (
    <aside className="space-y-6 hidden lg:block">
      <TrendingSection articles={trendingArticles} />
      {categoryVideos.length > 0 && <VideoColumn videos={categoryVideos} />}
      <WeatherMarketWidget />
      {rssFeed && <RSSFeed feedUrl={rssFeed.url} title={rssFeed.title} />}
      <AdvertorialBanner ad={SPONSORED_AD} />
      <ChannelFollowCTA />
      <AdSlot />
      <NewsletterSignup />
    </aside>
  );
};

export default PageSidebar;
