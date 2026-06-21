'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { usePathname } from 'next/navigation';

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, languages, currentLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const pathname = usePathname();
  useClickOutside(ref, open, () => setOpen(false));

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, { passive: true, once: true });
    return () => window.removeEventListener('scroll', close);
  }, [open]);

  const handleSelect = useCallback((code) => {
    setLanguage(code);
    setOpen(false);
  }, [setLanguage]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={
          compact
            ? 'btn-ghost p-2.5 rounded-xl flex items-center space-x-1.5'
            : 'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-dark-surface-1 hover:border-brand-300 dark:hover:border-brand-700 transition-colors min-h-[44px]'
        }
        aria-label={`Language: ${currentLang.nativeName}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className={`w-4 h-4 flex-shrink-0 ${compact ? 'w-5 h-5' : 'text-brand-600 dark:text-brand-400'}`} />
        {!compact && (
          <>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 max-w-[5.5rem] truncate">
              {currentLang.nativeName}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface-1 border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 z-[100] shadow-xl max-h-80 overflow-y-auto"
        >
          {languages.map(lang => {
            const selected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${
                  selected
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface-2'
                }`}
              >
                <div className="min-w-0">
                  <span className="block truncate">{lang.nativeName}</span>
                  {lang.nativeName !== lang.name && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{lang.name}</span>
                  )}
                </div>
                {selected && <Check className="w-4 h-4 flex-shrink-0 text-brand-600 dark:text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
