'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Bell, Sun, Moon, LogIn, BookmarkIcon, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useClickOutside } from '../hooks/useClickOutside';
import { HEADER_NAV } from '../config/feeds.config';
import LanguageSwitcher from './LanguageSwitcher';

const NotificationsPanel = lazy(() => import('./NotificationsPanel'));

let _trendingCache = { value: null, ts: 0 };
const TRENDING_CACHE_MS = 5 * 60 * 1000;

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasTrending, setHasTrending] = useState(_trendingCache.value ?? false);
  const profileRef = useRef(null);
  const searchTrapRef = useFocusTrap(searchOpen);
  const menuTrapRef = useFocusTrap(mobileMenuOpen);
  const profileTrapRef = useFocusTrap(profileOpen);
  useClickOutside(profileRef, profileOpen, () => setProfileOpen(false));
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (Date.now() - _trendingCache.ts < TRENDING_CACHE_MS) {
      setHasTrending(_trendingCache.value);
      return;
    }
    import('../services/firestore').then(({ getTrendingArticles }) =>
      getTrendingArticles(1).then(articles => {
        const has = articles.length > 0;
        _trendingCache = { value: has, ts: Date.now() };
        setHasTrending(has);
      })
    ).catch(() => setHasTrending(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const isActive = (path) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 safe-top transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 dark:bg-dark-surface-0/90 backdrop-blur-glass shadow-glass border-b border-gray-200/50 dark:border-gray-800/50'
            : 'bg-white/80 dark:bg-dark-surface-0/80 backdrop-blur-sm md:bg-transparent md:dark:bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <span className="text-white font-bold text-base">B</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg text-gray-900 dark:text-white">The Bharath </span>
                <span className="font-display font-bold text-lg text-brand-600 dark:text-brand-400">News</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {HEADER_NAV.map(link => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-dark-surface-2'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-ghost touch-target rounded-xl"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="hidden md:flex items-center space-x-1">
                <LanguageSwitcher />
                <button
                  onClick={toggleTheme}
                  className="btn-ghost touch-target rounded-xl"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="btn-ghost touch-target rounded-xl relative"
                aria-label="Trending stories"
                aria-expanded={notificationsOpen}
              >
                <Bell className="w-5 h-5" />
                {hasTrending && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-accent-rose rounded-full" />
                )}
              </button>
              {notificationsOpen && (
                <Suspense fallback={null}>
                  <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
                </Suspense>
              )}

              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-label="User menu"
                    aria-expanded={profileOpen}
                    className="touch-target w-11 h-11 rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-brand-500/50 transition-all p-0.5"
                  >
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=4338ca&color=fff`} alt="" className="w-full h-full object-cover" />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        ref={profileTrapRef}
                        role="menu"
                        aria-label="User menu"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-56 glass-card-solid rounded-2xl p-2 z-50"
                      >
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{user.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link href="/dashboard" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 text-sm text-gray-700 dark:text-gray-300">
                          <BookmarkIcon className="w-4 h-4" /><span>My Dashboard</span>
                        </Link>
                        <Link href="/bookmarks" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 text-sm text-gray-700 dark:text-gray-300">
                          <BookmarkIcon className="w-4 h-4" /><span>Bookmarks</span>
                        </Link>
                        <Link href="/settings" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 text-sm text-gray-700 dark:text-gray-300">
                          <SettingsIcon className="w-4 h-4" /><span>Settings</span>
                        </Link>
                        {isAdmin && (
                          <Link href="/admin/dashboard" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 text-sm text-brand-700 dark:text-brand-300">
                            <SettingsIcon className="w-4 h-4" /><span>Admin</span>
                          </Link>
                        )}
                        <button onClick={logout} className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-sm text-red-600">
                          <LogIn className="w-4 h-4" /><span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className="btn-primary text-sm hidden sm:flex items-center space-x-1.5">
                  <LogIn className="w-4 h-4" /><span>Sign In</span>
                </Link>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden btn-ghost touch-target rounded-xl"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-start justify-center sm:pt-24"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              ref={searchTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl mx-4 mb-0 sm:mb-auto bg-white dark:bg-dark-surface-1 rounded-t-2xl sm:rounded-2xl shadow-floating overflow-hidden safe-bottom"
            >
              <div className="flex items-center p-4 border-b border-gray-100 dark:border-gray-800">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search news, topics, categories..."
                  className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value) {
                      router.push(`/search?q=${encodeURIComponent(e.target.value)}`);
                      setSearchOpen(false);
                    }
                  }}
                />
                <button onClick={() => setSearchOpen(false)} aria-label="Close search" className="touch-target hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Trending</p>
                <div className="flex flex-wrap gap-2">
                  {['India GCC Trade', 'Dubai Jobs', 'Kerala Floods', 'Tech Layoffs', 'Cricket'].map(term => (
                    <button
                      key={term}
                      onClick={() => { router.push(`/search?q=${encodeURIComponent(term)}`); setSearchOpen(false); }}
                      className="category-pill category-pill-inactive text-xs"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              ref={menuTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-dark-surface-0 shadow-floating p-6 safe-top safe-bottom overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-display font-bold text-xl text-gray-900 dark:text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="touch-target hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {HEADER_NAV.map(link => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`block px-4 py-3 rounded-xl font-medium transition-colors min-h-[44px] flex items-center ${
                      isActive(link.path)
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">Preferences</p>
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Language</span>
                  <LanguageSwitcher />
                </div>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2 min-h-[44px]"
                >
                  <span className="text-sm font-medium">Theme</span>
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              {!user && (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full mt-6 flex items-center justify-center space-x-2">
                  <LogIn className="w-4 h-4" /><span>Sign In with Google</span>
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16" />
    </>
  );
};

export default Header;
