'use client';

import { useEffect, useState } from 'react';
import { YOUTUBE_CHANNELS } from '@/config/feeds.config';
import { loadVideoChannels } from '@/lib/video-catalog';

export function useVideoCatalog() {
  const [channels, setChannels] = useState(YOUTUBE_CHANNELS);

  useEffect(() => {
    let cancelled = false;
    loadVideoChannels().then(list => {
      if (!cancelled && list.length) setChannels(list);
    });
    return () => { cancelled = true; };
  }, []);

  return channels;
}
