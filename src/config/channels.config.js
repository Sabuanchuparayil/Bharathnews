import { mergeSiteSettings, buildSocialChannels } from './site-settings';

/** Static fallback when Firestore settings are not loaded yet. */
export const SOCIAL_CHANNELS = buildSocialChannels(mergeSiteSettings({
  integrations: {
    whatsapp: {
      channelUrl: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || '',
    },
    telegram: {
      channelUrl: 'https://t.me/TheBharathNews',
    },
  },
}));

export { buildSocialChannels };

export const TELEGRAM_CHANNEL_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_ID || '@TheBharathNews';
