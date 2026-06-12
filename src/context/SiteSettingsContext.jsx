import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getDbAsync, firestoreOps } from '@/lib/firebase-client';
import { mergeSiteSettings, buildSocialChannels } from '@/lib/site-settings';

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => mergeSiteSettings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDbAsync();
        if (!db) return;
        const { doc, getDoc } = await firestoreOps();
        const snap = await getDoc(doc(db, 'settings', 'site'));
        if (!cancelled && snap.exists()) {
          setSettings(mergeSiteSettings(snap.data()));
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const socialChannels = useMemo(() => buildSocialChannels(settings), [settings]);

  const value = useMemo(() => ({
    settings,
    loading,
    socialChannels,
    siteName: settings.siteName,
    tagline: settings.tagline,
    footerText: settings.footerText,
    whatsapp: settings.integrations?.whatsapp,
    telegram: settings.integrations?.telegram,
    email: settings.integrations?.email,
    showWhatsAppCta: settings.integrations?.whatsapp?.enabled !== false
      && settings.integrations?.whatsapp?.showFollowCta !== false
      && Boolean(settings.integrations?.whatsapp?.channelUrl),
  }), [settings, loading, socialChannels]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}
