'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { getCategoryFallbackImage } from '../utils/articleImages';

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';

const OPTIMIZED_HOSTS = [
  'images.unsplash.com',
  'img.youtube.com',
  'i.ytimg.com',
  '*.googleusercontent.com',
  'firebasestorage.googleapis.com',
  'ui-avatars.com',
];

function canOptimize(url) {
  if (typeof url !== 'string') return false;
  if (!url.startsWith('https://')) return false;
  try {
    const { hostname } = new URL(url);
    return OPTIMIZED_HOSTS.some(pattern => {
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1);
        return hostname.endsWith(suffix) || hostname === suffix.slice(1);
      }
      return hostname === pattern;
    });
  } catch {
    return false;
  }
}

const SafeImage = ({ src, alt = '', className = '', category, fallback, width = 800, height = 450, sizes, ...props }) => {
  const resolvedFallback = fallback || (category ? getCategoryFallbackImage(category, alt) : DEFAULT_FALLBACK);
  const [imgSrc, setImgSrc] = useState(src || resolvedFallback);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src || resolvedFallback);
    setFailed(false);
  }, [src, resolvedFallback]);

  if (failed) {
    return (
      <div className={`${className} bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center`}>
        <ImageOff className="w-[20%] max-w-8 min-w-5 text-gray-400" />
      </div>
    );
  }

  const skipOptimization = !canOptimize(imgSrc);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
      unoptimized={skipOptimization}
      onError={() => {
        if (imgSrc !== resolvedFallback) {
          setImgSrc(resolvedFallback);
        } else {
          setFailed(true);
        }
      }}
      {...props}
    />
  );
};

export default SafeImage;
