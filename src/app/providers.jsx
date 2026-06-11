'use client';

import React, { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/context/AuthContext';
import { InterestProvider } from '@/context/InterestContext';
import { ThemeProvider } from '@/context/ThemeContext';
import InstallPWA from '@/components/InstallPWA';

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
        <InterestProvider>
          <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'user'}>
            {children}
            <InstallPWA />
            <ToastContainer
              position="bottom-center"
              autoClose={2500}
              newestOnTop
              closeOnClick
              pauseOnHover
              toastClassName="!rounded-xl !shadow-glass !font-body"
              className="!bottom-20 md:!bottom-4"
            />
          </MotionConfig>
        </InterestProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
