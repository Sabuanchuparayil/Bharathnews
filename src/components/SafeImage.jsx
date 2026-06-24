'use client';

import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { getUniqueFallbackImage, LOCAL_PLACEHOLDER } from '../utils/articleImages';

const SafeImage = ({ src, alt = '', className = '', category, fallback, width = 800, height = 450, sizes, priority, ...props }) => {
  const seed = alt || src || '';
  const resolvedFallback = fallback || (category ? getUniqueFallbackImage(seed, category) : LOCAL_PLACEHOLDER);
  const displaySrc = src || resolvedFallback;
  const [imgSrc, setImgSrc] = useState(displaySrc);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src || resolvedFallback);
    setFailed(false);
  }, [src, resolvedFallback]);

  const handleError = () => {
    if (imgSrc !== resolvedFallback) {
      setImgSrc(resolvedFallback);
    } else if (imgSrc !== LOCAL_PLACEHOLDER) {
      setImgSrc(LOCAL_PLACEHOLDER);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className={`${className} bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center`}>
        <ImageOff className="w-[20%] max-w-8 min-w-5 text-gray-400" />
      </div>
    );
  }

  // External news CDNs + YouTube/Unsplash — load directly; Next.js optimizer causes HTTP/2 errors on Railway.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage;
