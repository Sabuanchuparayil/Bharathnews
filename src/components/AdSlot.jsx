'use client';

import React, { useEffect, useRef } from 'react';

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

const AdSlot = ({ slot, format = 'auto', responsive = true, className = '' }) => {
  const adRef = useRef(null);
  const adSlot = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR;

  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current && adSlot && PUBLISHER_ID) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // AdSense not loaded or ad blocker active
    }
  }, [adSlot]);

  if (!PUBLISHER_ID || !adSlot) {
    return (
      <div className={`bg-surface-2 dark:bg-dark-surface-2 rounded-xl p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 w-full ${className}`}>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Ad Space</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Configure NEXT_PUBLIC_ADSENSE_PUBLISHER_ID</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdSlot;
