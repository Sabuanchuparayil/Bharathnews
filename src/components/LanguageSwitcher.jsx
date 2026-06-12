'use client';

import React, { useState, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, languages, currentLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, open, () => setOpen(false));

  const displayLabel = currentLang.nativeName;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-ghost p-2.5 rounded-xl flex items-center space-x-1"
        aria-label="Filter by language"
        aria-expanded={open}
      >
        <Globe className="w-5 h-5" />
        {!compact && (
          <>
            <span className="text-sm font-medium hidden sm:inline">{displayLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 hidden sm:inline" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 glass-card-solid rounded-2xl p-2 z-50 shadow-lg max-h-80 overflow-y-auto">
          {languages.map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => { setLanguage(lang.code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                language === lang.code
                  ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2'
              }`}
            >
              <span className="block">{lang.nativeName}</span>
              <span className="text-xs text-gray-400">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
