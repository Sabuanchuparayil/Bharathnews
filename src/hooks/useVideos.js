import { useState, useEffect } from 'react';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';

export function useVideos(channelId = 'all') {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const allVideos = [];
        const channels = channelId === 'all'
          ? YOUTUBE_CHANNELS
          : YOUTUBE_CHANNELS.filter(c => c.channelId === channelId);

        for (const channel of channels) {
          const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
          const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
          const response = await fetch(apiUrl);
          const data = await response.json();

          if (data.status === 'ok') {
            const channelVideos = data.items.slice(0, 5).map(item => ({
              title: item.title,
              videoId: item.link.split('v=')[1] || item.guid?.split(':').pop(),
              channelName: channel.name,
              channelId: channel.channelId,
              thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.link.split('v=')[1]}/mqdefault.jpg`,
              publishedAt: item.pubDate,
              category: channel.category,
            }));
            allVideos.push(...channelVideos);
          }
        }

        allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setVideos(allVideos);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
      setLoading(false);
    };

    fetchVideos();
  }, [channelId]);

  return { videos, loading };
}
