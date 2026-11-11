'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { rowToApp } from '@/lib/db-mapper';
import { toggleBookmark, toggleLike } from '../services/articles';
import { setAuthCookies, clearAuthCookies } from '../lib/auth-cookies';
import { hasCompleteProfile } from '@/lib/profile-fields';
import { capsForRole, defaultAccessRoles, readAccessRoles } from '@/lib/access-roles';
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
  const [accessRoles, setAccessRoles] = useState(() => defaultAccessRoles());

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

    // Newest session sync wins; older in-flight syncs are ignored.
    let syncId = 0;

    const syncSession = async (session) => {
      const myId = ++syncId;
      const isStale = () => cancelled || myId !== syncId;

      if (!session?.user) {
        setUser(null);
        setUserProfile(null);
        clearAuthCookies();
        setLoading(false);
        return;
      }

      setUser(session.user);
      try {
        let profile = await loadProfile(supabase, session.user.id);
        if (isStale()) return;
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
          if (isStale()) return;
        }
        if (profile?.status && profile.status !== 'active') {
          // A newer sign-in may have started while this profile load was in flight.
          if (isStale()) return;
          const blockedStatus = profile.status;
          setUser(null);
          setUserProfile(null);
          clearAuthCookies();
          setLoading(false);
          supabase.auth.signOut().finally(() => {
            if (isStale()) return;
            window.location.replace(`/login?reason=${encodeURIComponent(blockedStatus)}`);
          });
          return;
        }
        setUserProfile(profile);
        const catalog = await readAccessRoles(supabase).catch(() => accessRoles);
        if (isStale()) return;
        setAccessRoles(catalog);
        setAuthCookies(profile?.role || 'reader', {
          emailVerified: profile?.emailVerified,
          profileComplete: hasCompleteProfile(profile),
          caps: capsForRole(catalog, profile?.role || 'reader'),
        });
      } catch (err) {
        if (isStale()) return;
        logger.error('Failed to load user profile:', err);
        setUserProfile(null);
      }
      setLoading(false);
    };

    // The callback must stay synchronous: awaiting Supabase queries (or auth calls) inside
    // onAuthStateChange deadlocks on the auth lock, leaving `loading` stuck on true.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setTimeout(() => {
        void syncSession(session);
      }, 0);
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
    if (profile?.status && profile.status !== 'active') {
      const blockedStatus = profile.status;
      setUser(null);
      setUserProfile(null);
      clearAuthCookies();
      supabase.auth.signOut().finally(() => {
        window.location.replace(`/login?reason=${encodeURIComponent(blockedStatus)}`);
      });
      return null;
    }
    if (profile) {
      const catalog = await readAccessRoles(supabase).catch(() => accessRoles);
      setAccessRoles(catalog);
      setUserProfile(profile);
      setAuthCookies(profile.role || 'reader', {
        emailVerified: profile.emailVerified,
        profileComplete: hasCompleteProfile(profile),
        caps: capsForRole(catalog, profile.role || 'reader'),
      });
    }
    return profile;
  }, [user, loadProfile, accessRoles]);

  // Role or catalog changes made by an admin reach open tabs without a new sign-in.
  useEffect(() => {
    if (!user || typeof window === 'undefined') return undefined;
    let lastRun = Date.now();
    const recheck = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastRun < 60 * 1000) return;
      lastRun = Date.now();
      refreshUserProfile().catch(err => logger.error('Failed to refresh access:', err));
    };
    const timer = window.setInterval(recheck, 5 * 60 * 1000);
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, [user, refreshUserProfile]);

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
      if (/banned/i.test(error.message || '')) {
        throw new Error('This account has been suspended or deactivated. Contact the site owner.');
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
  const caps = new Set(capsForRole(accessRoles, role));

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
    isEmailVerified: userProfile?.emailVerified === true,
    isProfileComplete: userProfile?.profileComplete === true,
    isAdmin: caps.has('admin'),
    isContentWriter: caps.has('editorial') || caps.has('admin'),
    isContributor: caps.has('contributor') || caps.has('admin'),
    isVlogger: caps.has('vlogger') || caps.has('admin'),
    isCreator: caps.has('contributor') || caps.has('vlogger') || caps.has('editorial') || caps.has('admin'),
    isEmployer: caps.has('employer') || caps.has('admin'),
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
