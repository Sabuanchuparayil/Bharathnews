'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const ChannelFollowCTA = () => {
  const { socialChannels, showWhatsAppCta, telegram } = useSiteSettings();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem('channelCTAdismissed') === 'true');
  }, []);

  const whatsappUrl = socialChannels.whatsapp?.url;
  const telegramUrl = socialChannels.telegram?.url || telegram?.channelUrl;
  const showWhatsApp = showWhatsAppCta && whatsappUrl;
  const showTelegram = telegram?.enabled !== false && telegramUrl;

  if (dismissed || (!showWhatsApp && !showTelegram)) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('channelCTAdismissed', 'true');
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border border-green-200 dark:border-green-800/50 rounded-xl p-6 relative">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="w-5 h-5" />
      </button>

      <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">
        Never miss a story
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        Get breaking news instantly on your favorite platform
      </p>

      <div className="flex flex-wrap gap-3">
        {showWhatsApp && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        )}
        {showTelegram && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Telegram</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ChannelFollowCTA;
