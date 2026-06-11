'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getClientFirebase } from '../config/firebase.config';
import { toggleBookmark, toggleLike } from '../services/firestore';
import logger from '../utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fb = getClientFirebase();
    if (!fb?.auth) {
      setLoading(false);
      return undefined;
    }

    let unsubscribe;
    let cancelled = false;

    (async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      if (cancelled) return;

      const { auth, db } = fb;
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setUserProfile(profileSnap.data());
            document.cookie = `bn_auth=1; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `bn_role=${profileSnap.data().role || 'reader'}; path=/; max-age=86400; SameSite=Lax`;
          } else {
            await setDoc(profileRef, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              role: 'reader',
              language: 'en',
              createdAt: serverTimestamp(),
              interests: {
                categories: {},
                topics: [],
                sources: {},
                readingTimes: {},
              },
              bookmarks: [],
              likes: [],
            });
            const saved = await getDoc(profileRef);
            setUserProfile(saved.data());
            document.cookie = `bn_auth=1; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `bn_role=reader; path=/; max-age=86400; SameSite=Lax`;
          }
        } else {
          setUser(null);
          setUserProfile(null);
          document.cookie = 'bn_auth=; path=/; max-age=0';
          document.cookie = 'bn_role=; path=/; max-age=0';
        }
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const loginWithGoogle = async () => {
    const fb = getClientFirebase();
    if (!fb?.auth || !fb?.googleProvider) return;
    try {
      const { signInWithPopup } = await import('firebase/auth');
      await signInWithPopup(fb.auth, fb.googleProvider);
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const fb = getClientFirebase();
    if (!fb?.auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(fb.auth);
  };

  const updateUserInterests = async (interests) => {
    if (!user) return;
    const fb = getClientFirebase();
    if (!fb?.db) return;
    const { doc, updateDoc } = await import('firebase/firestore');
    const profileRef = doc(fb.db, 'users', user.uid);
    const updated = {
      interests: {
        ...userProfile?.interests,
        ...interests,
      },
      onboardingComplete: true,
    };
    await updateDoc(profileRef, updated);
    setUserProfile(prev => ({ ...prev, ...updated }));
  };

  const isBookmarked = (articleId) => userProfile?.bookmarks?.includes(articleId) ?? false;
  const isLiked = (articleId) => userProfile?.likes?.includes(articleId) ?? false;

  const handleToggleBookmark = async (articleId) => {
    if (!user) return false;
    const bookmarked = isBookmarked(articleId);
    setUserProfile(prev => ({
      ...prev,
      bookmarks: bookmarked
        ? (prev.bookmarks || []).filter(id => id !== articleId)
        : [...(prev.bookmarks || []), articleId],
    }));
    try {
      await toggleBookmark(user.uid, articleId, bookmarked);
      return !bookmarked;
    } catch (error) {
      setUserProfile(prev => ({
        ...prev,
        bookmarks: bookmarked
          ? [...(prev.bookmarks || []), articleId]
          : (prev.bookmarks || []).filter(id => id !== articleId),
      }));
      logger.error('Bookmark toggle failed:', error);
      return bookmarked;
    }
  };

  const handleToggleLike = async (articleId) => {
    if (!user) return false;
    const liked = isLiked(articleId);
    setUserProfile(prev => ({
      ...prev,
      likes: liked
        ? (prev.likes || []).filter(id => id !== articleId)
        : [...(prev.likes || []), articleId],
    }));
    try {
      await toggleLike(user.uid, articleId, liked);
      return !liked;
    } catch (error) {
      setUserProfile(prev => ({
        ...prev,
        likes: liked
          ? [...(prev.likes || []), articleId]
          : (prev.likes || []).filter(id => id !== articleId),
      }));
      logger.error('Like toggle failed:', error);
      return liked;
    }
  };

  const role = userProfile?.role || 'reader';

  const value = {
    user,
    userProfile,
    loading,
    loginWithGoogle,
    logout,
    updateUserInterests,
    isBookmarked,
    isLiked,
    toggleBookmark: handleToggleBookmark,
    toggleLike: handleToggleLike,
    isAdmin: role === 'admin',
    isContentWriter: role === 'content_writer' || role === 'admin',
    isContributor: role === 'contributor' || role === 'admin',
    isVlogger: role === 'vlogger' || role === 'admin',
    isCreator: ['contributor', 'vlogger', 'content_writer', 'admin'].includes(role),
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
