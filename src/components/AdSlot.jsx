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
    return null;
  }

  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1 text-center">Advertisement</p>
      <div className="min-h-[250px]">
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
    </div>
  );
};

export default AdSlot;
