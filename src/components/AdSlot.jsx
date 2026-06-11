import React, { useEffect, useRef } from 'react';

const AdSlot = ({ slot, format = 'auto', responsive = true, className = '' }) => {
  const adRef = useRef(null);

  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // AdSense not loaded or ad blocker active
    }
  }, []);

  if (!slot) {
    return (
      <div className={`bg-surface-2 dark:bg-dark-surface-2 rounded-xl p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Ad Space</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Premium ad space available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

export default AdSlot;
