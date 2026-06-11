export const SOCIAL_CHANNELS = {
  telegram: {
    name: 'Telegram',
    url: 'https://t.me/TheBharathNews',
    icon: 'Send',
  },
  whatsapp: {
    name: 'WhatsApp',
    url: 'https://whatsapp.com/channel/YOUR_CHANNEL_ID',
    icon: 'MessageCircle',
  },
  youtube: {
    name: 'YouTube',
    url: 'https://youtube.com/@TheBharathNews',
    icon: 'Youtube',
  },
};

export const TELEGRAM_CHANNEL_ID = import.meta.env.VITE_TELEGRAM_CHANNEL_ID || '@TheBharathNews';
