'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const visits = parseInt(localStorage.getItem('visitCount') || '0') + 1;
      localStorage.setItem('visitCount', String(visits));
      if (visits >= 2 && !localStorage.getItem('pwaInstallDismissed')) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwaInstallDismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 glass-card-solid rounded-2xl shadow-floating p-4 z-50 animate-slide-up border border-gray-100 dark:border-gray-800">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">B</span>
        </div>
        <div className="flex-1">
          <h3 className="font-display font-bold text-gray-900 dark:text-white">Install The Bharath News</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get instant access with offline reading and push notifications</p>
          <div className="flex space-x-3 mt-3">
            <button onClick={handleInstall} className="btn-primary text-sm flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>Install</span>
            </button>
            <button onClick={handleDismiss} className="btn-ghost text-sm">Not now</button>
          </div>
        </div>
        <button onClick={handleDismiss} aria-label="Dismiss install prompt" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
