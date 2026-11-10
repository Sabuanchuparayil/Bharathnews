'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Menu, ExternalLink, Sun, Moon, LogOut, UserRound, ChevronDown, LayoutDashboard, PenSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { WORKSPACES } from '../config/workspace-nav';
import { useSiteSettings } from '../context/SiteSettingsContext';

const iconButton = 'p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-surface-2 dark:hover:bg-dark-surface-2 hover:text-gray-900 dark:hover:text-white transition-colors';
const menuItem = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2';

const WorkspaceHeader = ({ workspace, onOpenNav }) => {
  const { user, userProfile, isAdmin, logout } = useAuth();
  const { siteName, headerText } = useSiteSettings();
  const brandName = headerText || siteName || 'The Bharath News';
  const brandParts = brandName.trim().split(/\s+/);
  const brandTail = brandParts.length > 1 ? brandParts.pop() : '';
  const brandLead = brandParts.join(' ');
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, menuOpen, () => setMenuOpen(false));

  const current = WORKSPACES[workspace] || WORKSPACES.admin;
  const name = userProfile?.displayName || user?.email?.split('@')[0] || 'Account';
  const photo = userProfile?.photoURL
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D7377&color=fff`;
  const roleLabel = isAdmin ? 'Administrator' : 'Content writer';
  const profileHref = isAdmin ? '/admin/profile' : '/settings';
  const switchTo = workspace === 'admin'
    ? { href: WORKSPACES.desk.home, label: 'Newsroom', icon: PenSquare }
    : isAdmin ? { href: WORKSPACES.admin.home, label: 'Admin', icon: LayoutDashboard } : null;

  return (
    <header className="sticky top-0 z-40 h-14 bg-white/95 dark:bg-dark-surface-0/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 safe-top">
      <div className="h-full px-3 sm:px-5 flex items-center gap-3">
        <button type="button" onClick={onOpenNav} className={`${iconButton} lg:hidden`} aria-label="Open navigation">
          <Menu className="w-5 h-5" />
        </button>

        <Link href={current.home} className="flex items-center gap-2.5 min-w-0">
          <img src="/logo-mark.png" alt="" width={32} height={32} className="w-8 h-8 rounded-lg flex-shrink-0" />
          <span className="hidden sm:inline font-display font-bold text-sm text-gray-900 dark:text-white whitespace-nowrap">
            {brandLead}{brandTail ? ' ' : ''}{brandTail && <span className="text-brand-600 dark:text-brand-400">{brandTail}</span>}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
            {current.label}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {switchTo && (
            <Link
              href={switchTo.href}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2"
            >
              <switchTo.icon className="w-4 h-4" /> {switchTo.label}
            </Link>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2"
          >
            <ExternalLink className="w-4 h-4" /> View site
          </a>
          <button type="button" onClick={toggleTheme} className={iconButton} aria-label="Toggle theme">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-2 dark:hover:bg-dark-surface-2"
            >
              <img src={photo} alt="" className="w-8 h-8 rounded-lg object-cover" />
              <span className="hidden md:block text-left leading-tight">
                <span className="block text-sm font-medium text-gray-900 dark:text-white max-w-[140px] truncate">{name}</span>
                <span className="block text-[11px] text-gray-500">{roleLabel}</span>
              </span>
              <ChevronDown className="hidden md:block w-4 h-4 text-gray-400" />
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-dark-surface-1 shadow-floating p-1.5 z-50">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link href={profileHref} role="menuitem" className={menuItem} onClick={() => setMenuOpen(false)}>
                  <UserRound className="w-4 h-4" /> My profile
                </Link>
                {switchTo && (
                  <Link href={switchTo.href} role="menuitem" className={`${menuItem} md:hidden`} onClick={() => setMenuOpen(false)}>
                    <switchTo.icon className="w-4 h-4" /> {switchTo.label}
                  </Link>
                )}
                <a href="/" target="_blank" rel="noopener noreferrer" role="menuitem" className={`${menuItem} sm:hidden`}>
                  <ExternalLink className="w-4 h-4" /> View site
                </a>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
