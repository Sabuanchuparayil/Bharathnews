'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages.config';
import { useAuth } from './AuthContext';
import { getDbAsync, firestoreOps } from '@/lib/firebase-client';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'bharathnews_lang';

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      setLanguageState(saved);
    }
  }, []);

  useEffect(() => {
    if (user?.language && SUPPORTED_LANGUAGES.some(l => l.code === user.language)) {
      setLanguageState(user.language);
    }
  }, [user?.language]);

  const setLanguage = useCallback(async (code) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);

    if (user) {
      try {
        const db = await getDbAsync();
        if (!db) return;
        const { doc, updateDoc } = await firestoreOps();
        await updateDoc(doc(db, 'users', user.uid), { language: code });
      } catch {
        // non-blocking
      }
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
