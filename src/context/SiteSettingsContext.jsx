import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { mergeSiteSettings, buildSocialChannels } from '@/lib/site-settings';

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => mergeSiteSettings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) return;
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle();
        if (!cancelled && data?.value) {
          setSettings(mergeSiteSettings(data.value));
        }
      } catch {
        /* keep defaults */
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
