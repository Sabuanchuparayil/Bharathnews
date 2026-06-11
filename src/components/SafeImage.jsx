import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

const FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop';

const SafeImage = ({ src, alt = '', className = '', fallback = FALLBACK, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [failed, setFailed] = useState(false);

  return (
    <>
      {!failed ? (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          loading="lazy"
          onError={() => {
            if (imgSrc !== fallback) {
              setImgSrc(fallback);
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
