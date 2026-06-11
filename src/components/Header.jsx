import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Bell, Sun, Moon, LogIn, BookmarkIcon, Settings as SettingsIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, loginWithGoogle, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/india', label: 'India' },
    { to: '/gcc', label: 'GCC' },
    { to: '/business', label: 'Business' },
    { to: '/technology', label: 'Tech' },
    { to: '/videos', label: 'Videos' },
    { to: '/community', label: 'Community' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 dark:bg-dark-surface-0/90 backdrop-blur-glass shadow-glass border-b border-gray-200/50 dark:border-gray-800/50'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <span className="text-white font-bold text-base">B</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg text-gray-900 dark:text-white">Bharath</span>
                <span className="font-display font-bold text-lg text-brand-600 dark:text-brand-400">News</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-dark-surface-2'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-ghost p-2.5 rounded-xl"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={toggleTheme}
                className="btn-ghost p-2.5 rounded-xl"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button className="btn-ghost p-2.5 rounded-xl relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-rose rounded-full" />
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-brand-500/50 transition-all"
                  >
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=4338ca&color=fff`} alt="" className="w-full h-full object-cover" />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-56 glass-card-solid rounded-2xl p-2 z-50"
                      >
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{user.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link to="/bookmarks" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 text-sm text-gray-700 dark:text-gray-300">
                          <BookmarkIcon className="w-4 h-4" /><span>Bookmarks</span>
                        </Link>
                        <Link to="/settings" className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-surface-2 dark:hover:bg-dark-surface-2 text-sm text-gray-700 dark:text-gray-300">
                          <SettingsIcon className="w-4 h-4" /><span>Settings</span>
                        </Link>
                        <button onClick={logout} className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-sm text-red-600">
                          <LogIn className="w-4 h-4" /><span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button onClick={loginWithGoogle} className="btn-primary text-sm hidden sm:flex items-center space-x-1.5">
                  <LogIn className="w-4 h-4" /><span>Sign In</span>
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden btn-ghost p-2.5 rounded-xl"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start justify-center pt-24"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl mx-4 bg-white dark:bg-dark-surface-1 rounded-2xl shadow-floating overflow-hidden"
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
                      navigate(`/search?q=${encodeURIComponent(e.target.value)}`);
                      setSearchOpen(false);
                    }
                  }}
                />
                <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Trending</p>
                <div className="flex flex-wrap gap-2">
                  {['India GCC Trade', 'Dubai Jobs', 'Kerala Floods', 'Tech Layoffs', 'Cricket'].map(term => (
                    <button
                      key={term}
                      onClick={() => { navigate(`/search?q=${encodeURIComponent(term)}`); setSearchOpen(false); }}
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-dark-surface-0 shadow-floating p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="font-display font-bold text-xl text-gray-900 dark:text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                      isActive(link.to)
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              {!user && (
                <button onClick={loginWithGoogle} className="btn-primary w-full mt-6 flex items-center justify-center space-x-2">
                  <LogIn className="w-4 h-4" /><span>Sign In with Google</span>
                </button>
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
