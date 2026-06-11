import React, { useState } from 'react';
import { X, MessageCircle, Send } from 'lucide-react';

const ChannelFollowCTA = () => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('channelCTAdismissed') === 'true'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('channelCTAdismissed', 'true');
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
        Never miss a story
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        Get breaking news instantly on your favorite platform
      </p>

      <div className="flex flex-wrap gap-3">
        <a
          href="https://whatsapp.com/channel/YOUR_CHANNEL_ID"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>
        <a
          href="https://t.me/TheBharathNews"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Telegram</span>
        </a>
      </div>
    </div>
  );
};

export default ChannelFollowCTA;
