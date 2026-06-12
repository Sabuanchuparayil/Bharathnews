'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initClientFirebase } from '../config/firebase.config';
import { toggleBookmark, toggleLike } from '../services/firestore';
import { setAuthCookies, clearAuthCookies } from '../lib/auth-cookies';
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
    let unsubscribe;
    let cancelled = false;

    (async () => {
      const fb = await initClientFirebase();
      if (cancelled || !fb?.auth) {
        setLoading(false);
        return;
      }

      const { onAuthStateChanged } = await import('firebase/auth');
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      if (cancelled) return;

      const { auth, db } = fb;
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            const profileRef = doc(db, 'users', firebaseUser.uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const profile = profileSnap.data();
              setUserProfile(profile);
              setAuthCookies(profile.role || 'reader');
            } else {
              await setDoc(profileRef, {
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                role: 'reader',
                language: 'all',
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
              setAuthCookies('reader');
            }
          } catch (err) {
            logger.error('Failed to load user profile:', err);
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          clearAuthCookies();
        }
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return null;
    const fb = await initClientFirebase();
    if (!fb?.db) return null;
    const { doc, getDoc } = await import('firebase/firestore');
    const profileRef = doc(fb.db, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) return null;
    const profile = profileSnap.data();
    setUserProfile(profile);
    setAuthCookies(profile.role || 'reader');
    return profile;
  }, [user]);

  const loginWithGoogle = async () => {
    const fb = await initClientFirebase();
    if (!fb?.auth || !fb?.googleProvider) {
      throw new Error('Authentication unavailable. Please refresh and try again.');
    }
    try {
      const { signInWithPopup, signInWithRedirect } = await import('firebase/auth');
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (inIframe) {
        await signInWithRedirect(fb.auth, fb.googleProvider);
        return;
      }
      await signInWithPopup(fb.auth, fb.googleProvider);
    } catch (error) {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
        try {
          const { signInWithRedirect } = await import('firebase/auth');
          await signInWithRedirect(fb.auth, fb.googleProvider);
          return;
        } catch (redirectErr) {
          logger.error('Google redirect login error:', redirectErr);
          throw redirectErr;
        }
      }
      logger.error('Login error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    const fb = await initClientFirebase();
    if (!fb?.auth) throw new Error('Authentication unavailable. Please refresh and try again.');
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(fb.auth, email.trim(), password);
    } catch (error) {
      logger.error('Email login error:', error);
      const code = error?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        throw new Error('Invalid email or password.');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please try again later.');
      }
      throw new Error(error?.message || 'Sign in failed.');
    }
  };

  const logout = async () => {
    const fb = await initClientFirebase();
    if (!fb?.auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(fb.auth);
  };

  const updateUserInterests = async (interests) => {
    if (!user) return;
    const fb = await initClientFirebase();
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
    loginWithEmail,
    logout,
    refreshUserProfile,
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
