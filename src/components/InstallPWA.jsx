'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    && !window.MSStream;
}

function isSamsungBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /SamsungBrowser/i.test(navigator.userAgent);
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const visits = parseInt(localStorage.getItem('visitCount') || '0', 10) + 1;
    localStorage.setItem('visitCount', String(visits));
    const dismissed = localStorage.getItem('pwaInstallDismissed') === 'true';

    if (isIOS() && visits >= 2 && !dismissed) {
      setIosMode(true);
      setShowBanner(true);
      return undefined;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (visits >= 2 && !dismissed) {
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
          {iosMode ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tap <Share className="w-3.5 h-3.5 inline -mt-0.5" /> Share, then &quot;Add to Home Screen&quot; to install the app.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Get quick access from your home screen with offline support.
              </p>
              {isSamsungBrowser() && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                  If install fails, open this site in Chrome and install from there.
                </p>
              )}
            </>
          )}
          <div className="flex space-x-3 mt-3">
            {!iosMode && deferredPrompt && (
              <button onClick={handleInstall} className="btn-primary text-sm flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>Install</span>
              </button>
            )}
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
