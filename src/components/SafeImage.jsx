'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { getCategoryFallbackImage, LOCAL_PLACEHOLDER } from '../utils/articleImages';

const SafeImage = ({ src, alt = '', className = '', category, fallback, width = 800, height = 450, sizes, ...props }) => {
  const resolvedFallback = fallback || (category ? getCategoryFallbackImage(category, alt) : LOCAL_PLACEHOLDER);
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

  const isLocal = typeof imgSrc === 'string' && imgSrc.startsWith('/');

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
      unoptimized={!isLocal}
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
