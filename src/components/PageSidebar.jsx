'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
import { getActiveSponsors } from '../services/sponsors';

const PageSidebar = ({ trendingArticles = [], category = null }) => {
  const { videos } = useVideos('all');
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    getActiveSponsors('sidebar').then(setSponsors).catch(() => {});
  }, []);

  const categoryVideos = useMemo(() => {
    const filtered = category
      ? videos.filter(v => v.category === category)
      : videos;
    return filtered.slice(0, 4);
  }, [videos, category]);

  const rssFeed = category ? getFeedForCategory(category) : null;

  return (
    <aside className="space-y-6 hidden lg:block min-w-0 w-full">
      <TrendingSection articles={trendingArticles} />
      {categoryVideos.length > 0 && <VideoColumn videos={categoryVideos} />}
      <WeatherMarketWidget />
      {rssFeed && <RSSFeed feedUrl={rssFeed.url} title={rssFeed.title} />}
      {sponsors.map(s => (
        <AdvertorialBanner key={s.id} ad={{
          title: s.title,
          description: s.description,
          imageUrl: s.imageUrl,
          link: s.linkUrl,
          sponsoredBy: s.sponsoredBy,
        }} />
      ))}
      <ChannelFollowCTA />
      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR} />
      <NewsletterSignup />
    </aside>
  );
};

export default PageSidebar;
