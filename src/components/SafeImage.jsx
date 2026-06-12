'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { getCategoryFallbackImage, LOCAL_PLACEHOLDER } from '../utils/articleImages';

const OPTIMIZABLE_HOSTS = new Set([
  'images.unsplash.com',
  'img.youtube.com',
  'i.ytimg.com',
  'firebasestorage.googleapis.com',
  'ui-avatars.com',
]);

function canOptimize(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('/')) return true;
  try {
    const host = new URL(url).hostname;
    if (OPTIMIZABLE_HOSTS.has(host)) return true;
    for (const h of OPTIMIZABLE_HOSTS) {
      if (host.endsWith('.' + h)) return true;
    }
    return host.endsWith('.googleusercontent.com')
      || host.endsWith('.oneindia.com')
      || host.endsWith('.hindustantimes.com')
      || host.endsWith('.ndtv.com')
      || host.endsWith('.indiatimes.com');
  } catch {
    return false;
  }
}

const SafeImage = ({ src, alt = '', className = '', category, fallback, width = 800, height = 450, sizes, priority, ...props }) => {
  const resolvedFallback = fallback || (category ? getCategoryFallbackImage(category, alt) : LOCAL_PLACEHOLDER);
  const [imgSrc, setImgSrc] = useState(src || resolvedFallback);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src || resolvedFallback);
    setFailed(false);
  }, [src, resolvedFallback]);

  const optimized = useMemo(() => canOptimize(imgSrc), [imgSrc]);

  if (failed) {
    return (
      <div className={`${className} bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center`}>
        <ImageOff className="w-[20%] max-w-8 min-w-5 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? undefined : 'lazy'}
      priority={priority}
      sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
      unoptimized={!optimized}
      onError={() => {
        if (imgSrc !== resolvedFallback) {
          setImgSrc(resolvedFallback);
        } else if (imgSrc !== LOCAL_PLACEHOLDER) {
          setImgSrc(LOCAL_PLACEHOLDER);
        } else {
          setFailed(true);
        }
      }}
      {...props}
    />
  );
};

export default SafeImage;
