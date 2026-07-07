import { YOUTUBE_CHANNELS } from './feeds.config';
import { getLanguageByCode } from './languages.config';

/** Languages that have at least one YouTube channel in our catalog. */
export const VIDEO_CHANNEL_LANGUAGES = [...new Set(
  YOUTUBE_CHANNELS.map(c => c.language).filter(Boolean)
)].sort();

/** Pills shown on /videos — All + regional channel languages only. */
export function getVideoLanguageOptions() {
  const options = [
    { code: 'all', name: 'All Languages', nativeName: 'All Languages' },
  ];
  for (const code of VIDEO_CHANNEL_LANGUAGES) {
    const lang = getLanguageByCode(code);
    options.push({
      code,
      name: lang.name,
      nativeName: lang.nativeName,
    });
  }
  return options;
}

export function isVideoLanguageCode(code) {
  return code === 'all' || VIDEO_CHANNEL_LANGUAGES.includes(code);
}

export function channelsForVideoLanguage(langCode) {
  if (!langCode || langCode === 'all') return YOUTUBE_CHANNELS;
  return YOUTUBE_CHANNELS.filter(c => c.language === langCode);
}
