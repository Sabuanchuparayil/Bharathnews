'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_LANGUAGE, SELECTABLE_LANGUAGES, normalizeLanguageCode } from '@/config/languages.config';
import { useAuth } from './AuthContext';
import { getSupabaseBrowser } from '@/lib/supabase-client';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'bharathnews_lang';

function getInitialLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeLanguageCode(saved);
  } catch {}
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [language, setLanguageState] = useState(getInitialLanguage);
  const profileSyncedRef = useRef(false);

  useEffect(() => {
    const normalized = normalizeLanguageCode(language);
    if (normalized !== language) {
      setLanguageState(normalized);
      localStorage.setItem(STORAGE_KEY, normalized);
    }
  }, [language]);

  useEffect(() => {
    if (!userProfile?.language) {
      profileSyncedRef.current = false;
      return;
    }
    if (profileSyncedRef.current) return;
    const profileLang = normalizeLanguageCode(userProfile.language);
    if (SELECTABLE_LANGUAGES.some(l => l.code === profileLang)) {
      setLanguageState(profileLang);
      localStorage.setItem(STORAGE_KEY, profileLang);
      profileSyncedRef.current = true;
    }
  }, [userProfile?.language]);

  const setLanguage = useCallback(async (code) => {
    const next = normalizeLanguageCode(code);
    if (!SELECTABLE_LANGUAGES.some(l => l.code === next)) return;
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
    profileSyncedRef.current = true;

    if (user) {
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) return;
        await supabase.from('users').update({ language: next }).eq('id', user.id);
      } catch {}
    }
  }, [user]);

  const currentLang = SELECTABLE_LANGUAGES.find(l => l.code === language)
    || SELECTABLE_LANGUAGES.find(l => l.code === DEFAULT_LANGUAGE);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLang, languages: SELECTABLE_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
