'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from '@/context/AuthContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import { InterestProvider } from '@/context/InterestContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';

const InstallPWA = lazy(() => import('@/components/InstallPWA'));
const LazyToast = lazy(() =>
  import('react-toastify').then(mod => {
    import('react-toastify/dist/ReactToastify.css');
    return { default: mod.ToastContainer };
  })
);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function Providers({ children }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteSettingsProvider>
        <LanguageProvider>
        <InterestProvider>
          <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'user'}>
            {children}
            <Suspense fallback={null}>
              <InstallPWA />
              <LazyToast
                position="bottom-center"
                autoClose={2500}
                newestOnTop
                closeOnClick
                pauseOnHover
                toastClassName="!rounded-xl !shadow-glass !font-body"
                className="!bottom-20 md:!bottom-4"
              />
            </Suspense>
          </MotionConfig>
        </InterestProvider>
        </LanguageProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
