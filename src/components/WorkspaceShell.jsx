'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Layout from './Layout';
import WorkspaceHeader from './WorkspaceHeader';
import { isNavItemActive } from '../config/workspace-nav';

const NavList = ({ sections, pathname, tab, collapsed = false, onNavigate }) => (
  <nav className="space-y-5" aria-label="Workspace">
    {sections.map(section => (
      <div key={section.label}>
        {!collapsed && (
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {section.label}
          </p>
        )}
        <div className="space-y-0.5">
          {section.items.map(item => {
            const active = isNavItemActive(item, pathname, tab);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-surface-2 dark:hover:bg-dark-surface-2 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

// useSearchParams needs a Suspense boundary; the fallback renders without tab awareness.
const NavWithTab = (props) => {
  const tab = useSearchParams().get('tab');
  return <NavList {...props} tab={tab} />;
};

const WorkspaceNav = (props) => (
  <Suspense fallback={<NavList {...props} tab={null} />}>
    <NavWithTab {...props} />
  </Suspense>
);

const WorkspaceShell = ({
  workspace, sections, title, description, actions, maxWidth = 'max-w-7xl', children,
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <Layout showHeader={false} showFooter={false} showBottomNav={false} showChatbot={false} mainClassName="!pb-0">
      <WorkspaceHeader workspace={workspace} onOpenNav={() => setMobileOpen(true)} />

      <div className="flex">
        <aside
          className={`hidden lg:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface-0 transition-[width] duration-200 ${
            collapsed ? 'w-[68px]' : 'w-60'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <WorkspaceNav sections={sections} pathname={pathname} collapsed={collapsed} />
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(value => !value)}
            className="m-2 p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-surface-2 dark:hover:bg-dark-surface-2 self-end"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </aside>

        {mobileOpen && (
          <div className="lg:hidden">
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-surface-0 shadow-floating overflow-y-auto animate-slide-in-left">
              <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-800">
                <span className="font-display font-bold text-sm text-gray-900 dark:text-white">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-2 dark:hover:bg-dark-surface-2" aria-label="Close navigation">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="py-4 px-2">
                <WorkspaceNav sections={sections} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 min-h-[calc(100vh-3.5rem)]">
          {(title || actions) && (
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-surface-0">
              <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
                <div className="min-w-0">
                  {title && <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-900 dark:text-white truncate">{title}</h1>}
                  {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{actions}</div>}
              </div>
            </div>
          )}
          <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-6`}>
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkspaceShell;
