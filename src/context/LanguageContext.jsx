'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages.config';
import { useAuth } from './AuthContext';
import { getDbAsync, firestoreOps } from '@/lib/firebase-client';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'bharathnews_lang';

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'all';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) return saved;
  } catch {}
  return 'all';
}

export function LanguageProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [language, setLanguageState] = useState(getInitialLanguage);
  const profileSyncedRef = useRef(false);

  useEffect(() => {
    if (!userProfile?.language) {
      profileSyncedRef.current = false;
      return;
    }
    if (profileSyncedRef.current) return;
    if (SUPPORTED_LANGUAGES.some(l => l.code === userProfile.language)) {
      setLanguageState(userProfile.language);
      localStorage.setItem(STORAGE_KEY, userProfile.language);
      profileSyncedRef.current = true;
    }
  }, [userProfile?.language]);

  const setLanguage = useCallback(async (code) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === code)) return;
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
    profileSyncedRef.current = true;

    if (user) {
      try {
        const db = await getDbAsync();
        if (!db) return;
        const { doc, updateDoc } = await firestoreOps();
        await updateDoc(doc(db, 'users', user.uid), { language: code });
      } catch {}
    }
  }, [user]);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLang, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
