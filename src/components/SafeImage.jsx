'use client';

import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { getUniqueFallbackImage, LOCAL_PLACEHOLDER, NEWS_THUMB_CLASS } from '../utils/articleImages';

const SafeImage = ({ src, alt = '', className = '', category, fallback, width = 800, height = 450, sizes, priority, thumb = true, ...props }) => {
  const seed = alt || src || '';
  const resolvedFallback = fallback || (category ? getUniqueFallbackImage(seed, category) : LOCAL_PLACEHOLDER);
  const displaySrc = src && !isPlaceholderSrc(src) ? src : resolvedFallback;
  const [imgSrc, setImgSrc] = useState(displaySrc);
  const [failed, setFailed] = useState(false);

  function isPlaceholderSrc(url) {
    if (!url) return true;
    if (url.includes('images.unsplash.com/photo-1507003211169')) return true;
    if (url.includes('images.unsplash.com/photo-1576091160399')) return true;
    if (url.includes('images.unsplash.com/photo-1526470608268')) return true;
    if (url.includes('images.unsplash.com/photo-1521737711867')) return true;
    return false;
  }

  useEffect(() => {
    setImgSrc(src && !isPlaceholderSrc(src) ? src : resolvedFallback);
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

  const thumbClass = thumb && className.includes('object-cover') && !className.includes('object-top')
    ? NEWS_THUMB_CLASS
    : '';
  const mergedClass = [className, thumbClass].filter(Boolean).join(' ');

  // External news CDNs + YouTube/Unsplash — load directly; Next.js optimizer causes HTTP/2 errors on Railway.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={mergedClass}
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
