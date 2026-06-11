'use client';

import React, { lazy, Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';

const ChatbotWidget = lazy(() => import('./ChatbotWidget'));

const Layout = ({
  children,
  showBottomNav = true,
  showChatbot = true,
  showFooter = true,
  showHeader = true,
  mainClassName = '',
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-surface-1 dark:bg-dark-surface-0 text-gray-900 dark:text-gray-50 ${className}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-xl"
      >
        Skip to content
      </a>
      {showHeader && <Header />}
      <main id="main-content" className={`pb-20 md:pb-0 ${mainClassName}`}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showBottomNav && <BottomNav />}
      {showChatbot && (
        <Suspense fallback={null}>
          <ChatbotWidget />
        </Suspense>
      )}
    </div>
  );
};

export default Layout;
