'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { rowToApp } from '@/lib/db-mapper';
import { toggleBookmark, toggleLike } from '../services/articles';
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

  const loadProfile = useCallback(async (supabase, userId) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) {
      logger.error('Failed to load user profile:', error);
      return null;
    }
    if (data) return rowToApp(data);
    return null;
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (session?.user) {
        setUser(session.user);
        try {
          let profile = await loadProfile(supabase, session.user.id);
          if (!profile) {
            await supabase.from('users').upsert({
              id: session.user.id,
              email: session.user.email,
              display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              photo_url: session.user.user_metadata?.avatar_url || null,
              role: 'reader',
              language: 'all',
              interests: { categories: {}, topics: [], sources: {}, readingTimes: {} },
              bookmarks: [],
              likes: [],
            });
            profile = await loadProfile(supabase, session.user.id);
          }
          setUserProfile(profile);
          setAuthCookies(profile?.role || 'reader');
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return null;
    const supabase = getSupabaseBrowser();
    if (!supabase) return null;
    const profile = await loadProfile(supabase, user.id);
    if (profile) {
      setUserProfile(profile);
      setAuthCookies(profile.role || 'reader');
    }
    return profile;
  }, [user, loadProfile]);

  const loginWithGoogle = async (nextPath = '/dashboard') => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error('Authentication unavailable. Please refresh and try again.');
    const safeNext = (nextPath?.startsWith('/') && !nextPath.startsWith('//')) ? nextPath : '/dashboard';
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
      : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      logger.error('Login error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error('Authentication unavailable. Please refresh and try again.');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      logger.error('Email login error:', error);
      if (error.message?.includes('Invalid login')) {
        throw new Error('Invalid email or password.');
      }
      throw new Error(error.message || 'Sign in failed.');
    }
  };

  const logout = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const updateUserInterests = async (interests) => {
    if (!user) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const updated = {
      interests: { ...userProfile?.interests, ...interests },
      onboarding_complete: true,
    };
    await supabase.from('users').update({
      interests: updated.interests,
      onboarding_complete: true,
    }).eq('id', user.id);
    setUserProfile(prev => ({ ...prev, ...updated, onboardingComplete: true }));
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
      await toggleBookmark(user.id, articleId, bookmarked);
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
      await toggleLike(user.id, articleId, liked);
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
    isEmployer: role === 'employer' || role === 'admin',
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
