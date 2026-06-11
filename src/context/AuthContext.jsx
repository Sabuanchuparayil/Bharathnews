'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase.config';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setUserProfile(profileSnap.data());
        } else {
          const newProfile = {
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
          };
          await setDoc(profileRef, newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserInterests = async (interests) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
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
