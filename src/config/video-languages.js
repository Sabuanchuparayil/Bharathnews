import { YOUTUBE_CHANNELS } from './feeds.config';
import { getLanguageByCode } from './languages.config';

export function videoLanguageCodes(channels = YOUTUBE_CHANNELS) {
  return [...new Set(channels.map(item => item.language).filter(Boolean))].sort();
}

/** Languages that have at least one YouTube channel in the bootstrap seed. */
export const VIDEO_CHANNEL_LANGUAGES = videoLanguageCodes();

/** Pills shown on /videos — All + regional channel languages only. */
export function getVideoLanguageOptions(channels = YOUTUBE_CHANNELS) {
  const options = [
    { code: 'all', name: 'All Languages', nativeName: 'All Languages' },
  ];
  for (const code of videoLanguageCodes(channels)) {
    const lang = getLanguageByCode(code);
    const matched = lang?.code === code ? lang : null;
    options.push({
      code,
      name: matched?.name || code,
      nativeName: matched?.nativeName || code,
    });
  }
  return options;
}

export function isVideoLanguageCode(code, channels = YOUTUBE_CHANNELS) {
  return code === 'all' || videoLanguageCodes(channels).includes(code);
}

export function channelsForVideoLanguage(langCode, channels = YOUTUBE_CHANNELS) {
  if (!langCode || langCode === 'all') return channels;
  return channels.filter(item => item.language === langCode);
}
