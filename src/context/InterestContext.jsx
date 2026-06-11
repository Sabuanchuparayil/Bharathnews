'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { getDb, firestoreOps } from '@/lib/firebase-client';
import { useAuth } from './AuthContext';
import { updateInterests } from '../utils/interestScorer';
import { trackUserInteraction } from '../services/firestore';

const InterestContext = createContext(null);

export const useInterests = () => useContext(InterestContext);

export const InterestProvider = ({ children }) => {
  const { user, userProfile } = useAuth();

  const trackRead = useCallback(async (article, durationSeconds) => {
    if (!user) return;
    const db = getDb();
    if (!db) return;
    const { doc, updateDoc } = await firestoreOps();

    const action = durationSeconds > 30 ? 'read_long' : 'read';
    const newInterests = updateInterests(userProfile?.interests || {}, article, action);

    await updateDoc(doc(db, 'users', user.uid), { interests: newInterests });
    await trackUserInteraction(user.uid, article.id, action, { duration: durationSeconds });
  }, [user, userProfile]);

  const trackShare = useCallback(async (article) => {
    if (!user) return;
    const db = getDb();
    if (!db) return;
    const { doc, updateDoc } = await firestoreOps();
    const newInterests = updateInterests(userProfile?.interests || {}, article, 'share');
    await updateDoc(doc(db, 'users', user.uid), { interests: newInterests });
    await trackUserInteraction(user.uid, article.id, 'share', {});
  }, [user, userProfile]);

  const trackBookmark = useCallback(async (article) => {
    if (!user) return;
    const db = getDb();
    if (!db) return;
    const { doc, updateDoc } = await firestoreOps();
    const newInterests = updateInterests(userProfile?.interests || {}, article, 'bookmark');
    await updateDoc(doc(db, 'users', user.uid), { interests: newInterests });
    await trackUserInteraction(user.uid, article.id, 'bookmark', {});
  }, [user, userProfile]);

  return (
    <InterestContext.Provider value={{ trackRead, trackShare, trackBookmark }}>
      {children}
    </InterestContext.Provider>
  );
};
