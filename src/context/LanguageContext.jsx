'use client';

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { DEFAULT_LANGUAGE, SELECTABLE_LANGUAGES, normalizeLanguageCode } from '@/config/languages.config';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { getSupabaseBrowser } from '@/lib/supabase-client';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'bharathnews_lang';

function isSelectable(code) {
  return SELECTABLE_LANGUAGES.some(l => l.code === code);
}

/** `?lang=` from hreflang alternates wins over the saved preference. */
function getUrlLanguage() {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('lang');
  if (!raw) return null;
  const code = normalizeLanguageCode(raw);
  return isSelectable(code) ? code : null;
}

function clearUrlLanguage() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('lang')) return;
  url.searchParams.delete('lang');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function getSavedLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeLanguageCode(saved);
  } catch {}
  return null;
}

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function LanguageProvider({ children }) {
  const { user, userProfile } = useAuth();
  // Server and first client render must agree; the saved/URL language is applied after hydration.
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const profileSyncedRef = useRef(false);
  const pathname = usePathname();

  useClientLayoutEffect(() => {
    const fromUrl = getUrlLanguage();
    if (fromUrl) {
      setLanguageState(fromUrl);
      try { localStorage.setItem(STORAGE_KEY, fromUrl); } catch {}
      profileSyncedRef.current = true;
      return;
    }
    const saved = getSavedLanguage();
    if (saved) setLanguageState(saved);
  }, [pathname]);

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
    if (profileSyncedRef.current || getUrlLanguage()) return;
    const profileLang = normalizeLanguageCode(userProfile.language);
    if (SELECTABLE_LANGUAGES.some(l => l.code === profileLang)) {
      setLanguageState(profileLang);
      localStorage.setItem(STORAGE_KEY, profileLang);
      profileSyncedRef.current = true;
    }
  }, [userProfile?.language]);

  const setLanguage = useCallback(async (code) => {
    const next = normalizeLanguageCode(code);
    if (!isSelectable(next)) return;
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
    profileSyncedRef.current = true;
    clearUrlLanguage();

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
