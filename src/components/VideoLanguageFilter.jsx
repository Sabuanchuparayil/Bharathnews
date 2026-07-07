'use client';

import React from 'react';
import { getVideoLanguageOptions } from '@/config/video-languages';

const VideoLanguageFilter = ({ activeLanguage = 'all', onChange }) => {
  const options = getVideoLanguageOptions();

  return (
    <div className="relative min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
        Language
      </p>
      <div
        className="overflow-x-auto scrollbar-hide overscroll-x-contain pb-1 pt-0.5"
        role="tablist"
        aria-label="Video language"
      >
        <div className="flex gap-2 w-max pr-1">
          {options.map(opt => {
            const isActive = activeLanguage === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange?.(opt.code)}
                className={`category-pill flex-shrink-0 whitespace-nowrap text-sm px-3.5 py-1.5 rounded-full transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-700 dark:hover:text-brand-300'
                }`}
              >
                {opt.nativeName}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VideoLanguageFilter;
