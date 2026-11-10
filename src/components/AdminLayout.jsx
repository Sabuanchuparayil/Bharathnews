'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Send, Rss, PenSquare, Users as UsersIcon, Shield,
  Mail, Video, ShoppingBag, Settings, UserRound, ChevronLeft, ChevronRight,
  Menu, X,
} from 'lucide-react';
import Layout from './Layout';
import LoginPrompt from './LoginPrompt';
import { useAuth } from '../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/desk', icon: PenSquare, label: 'Newsroom' },
      { href: '/admin/sources', icon: Rss, label: 'Sources' },
      { href: '/admin/videos', icon: Video, label: 'Videos' },
      { href: '/admin/distribution', icon: Send, label: 'Distribution' },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/admin/moderation', icon: Shield, label: 'Moderation' },
      { href: '/admin/subscribers', icon: Mail, label: 'Subscribers' },
      { href: '/admin/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/settings?tab=users', icon: UsersIcon, label: 'Users & RBAC', matchPrefix: '/admin/settings' },
      { href: '/admin/settings', icon: Settings, label: 'Site Settings', matchPrefix: '/admin/settings' },
      { href: '/admin/staff', icon: UsersIcon, label: 'Staff Profiles' },
      { href: '/admin/profile', icon: UserRound, label: 'My Profile' },
    ],
  },
];

function isActive(pathname, item) {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

function NavItem({ item, collapsed, pathname, onClick }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`
        group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200
        ${collapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'}
        ${active
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
          : 'text-gray-600 dark:text-gray-400 hover:bg-surface-2 dark:hover:bg-dark-surface-2 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-brand-600'}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function Sidebar({ collapsed, setCollapsed, pathname }) {
  return (
    <aside
      className={`
        hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-[64px] border-r border-gray-100 dark:border-gray-800
        bg-white dark:bg-dark-surface-0 transition-all duration-300 overflow-y-auto
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
      `}
    >
      <div className="flex-1 py-4 space-y-5 px-2">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItem key={item.href + item.label} item={item} collapsed={collapsed} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="mx-auto mb-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

function MobileDrawer({ open, setOpen, pathname }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-white dark:bg-dark-surface-0 shadow-2xl lg:hidden overflow-y-auto animate-slide-in-left">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <span className="font-display font-bold text-sm text-brand-700 dark:text-brand-400">Admin Panel</span>
          <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-dark-surface-2">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="py-4 space-y-5 px-2">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavItem key={item.href + item.label} item={item} collapsed={false} pathname={pathname} onClick={() => setOpen(false)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const AdminLayout = ({ children, title, description, actions }) => {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt
            title={!user ? 'Sign In Required' : 'Access Denied'}
            description={!user ? 'Sign in with an admin account to access this page.' : 'Admin role required.'}
            nextPath={pathname}
            showAdminHint
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showChatbot={false} showFooter={false}>
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} pathname={pathname} />
        <MobileDrawer open={mobileOpen} setOpen={setMobileOpen} pathname={pathname} />

        <div className="flex-1 min-w-0">
          {(title || actions) && (
            <div className="sticky top-[64px] z-10 bg-surface-1/80 dark:bg-dark-surface-0/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-surface-2 dark:hover:bg-dark-surface-2"
                    aria-label="Open navigation"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    {title && <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-900 dark:text-white truncate">{title}</h1>}
                    {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{description}</p>}
                  </div>
                </div>
                {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
              </div>
            </div>
          )}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLayout;
