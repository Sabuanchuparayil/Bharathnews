'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { getCategoryFallbackImage } from '../utils/articleImages';

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';

const SafeImage = ({ src, alt = '', className = '', category, fallback, width = 800, height = 450, ...props }) => {
  const resolvedFallback = fallback || (category ? getCategoryFallbackImage(category) : DEFAULT_FALLBACK);
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

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      unoptimized
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
