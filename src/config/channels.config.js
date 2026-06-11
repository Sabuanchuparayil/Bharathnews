export const SOCIAL_CHANNELS = {
  telegram: {
    name: 'Telegram',
    url: 'https://t.me/TheBharathNews',
    icon: 'Send',
  },
  whatsapp: {
    name: 'WhatsApp Channel',
    url: import.meta.env.VITE_WHATSAPP_CHANNEL_URL || 'https://whatsapp.com/channel/0029VaXXXXXXXX',
    icon: 'MessageCircle',
  },
  youtube: {
    name: 'YouTube',
    url: 'https://youtube.com/@TheBharathNews',
    icon: 'Youtube',
  },
  instagram: {
    name: 'Instagram',
    url: 'https://instagram.com/thebharathnews',
    icon: 'Instagram',
  },
  facebook: {
    name: 'Facebook',
    url: 'https://facebook.com/thebharathnews',
    icon: 'Facebook',
  },
};

export const TELEGRAM_CHANNEL_ID = import.meta.env.VITE_TELEGRAM_CHANNEL_ID || '@TheBharathNews';
