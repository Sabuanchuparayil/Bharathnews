import { YOUTUBE_CHANNELS } from '@/config/feeds.config';

let pending = null;

/** Enabled YouTube sources from the newsroom catalog, or the bootstrap seed when none are saved. */
export function loadVideoChannels() {
  if (!pending) {
    pending = fetch('/api/videos/channels')
      .then(response => (response.ok ? response.json() : { channels: [] }))
      .then(data => (Array.isArray(data.channels) && data.channels.length ? data.channels : YOUTUBE_CHANNELS))
      .catch(() => YOUTUBE_CHANNELS);
  }
  return pending;
}
