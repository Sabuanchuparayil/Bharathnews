'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { useAuth } from './AuthContext';
import { updateInterests } from '../utils/interestScorer';

const InterestContext = createContext(null);

export const useInterests = () => useContext(InterestContext);

export const InterestProvider = ({ children }) => {
  const { user, userProfile } = useAuth();

  const updateUserInterests = useCallback(async (article, action) => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const newInterests = updateInterests(userProfile?.interests || {}, article, action);
    await supabase.from('users').update({ interests: newInterests }).eq('id', user.id);
  }, [user, userProfile]);

  const trackRead = useCallback(async (article, durationSeconds) => {
    if (!user) return;
    const action = durationSeconds > 30 ? 'read_long' : 'read';
    await updateUserInterests(article, action);
  }, [user, updateUserInterests]);

  const trackShare = useCallback(async (article) => {
    if (!user) return;
    await updateUserInterests(article, 'share');
  }, [user, updateUserInterests]);

  const trackBookmark = useCallback(async (article) => {
    if (!user) return;
    await updateUserInterests(article, 'bookmark');
  }, [user, updateUserInterests]);

  return (
    <InterestContext.Provider value={{ trackRead, trackShare, trackBookmark }}>
      {children}
    </InterestContext.Provider>
  );
};
