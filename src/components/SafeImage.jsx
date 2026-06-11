'use client';

import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { getCategoryFallbackImage } from '../utils/articleImages';

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';

const SafeImage = ({ src, alt = '', className = '', category, fallback, ...props }) => {
  const resolvedFallback = fallback || (category ? getCategoryFallbackImage(category) : DEFAULT_FALLBACK);
  const [imgSrc, setImgSrc] = useState(src || resolvedFallback);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src || resolvedFallback);
    setFailed(false);
  }, [src, resolvedFallback]);

  return (
    <>
      {!failed ? (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          loading="lazy"
          onError={() => {
            if (imgSrc !== resolvedFallback) {
              setImgSrc(resolvedFallback);
            } else {
              setFailed(true);
            }
          }}
          {...props}
        />
      ) : (
        <div className={`${className} bg-surface-2 dark:bg-dark-surface-2 flex items-center justify-center`}>
          <ImageOff className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </>
  );
};

export default SafeImage;
