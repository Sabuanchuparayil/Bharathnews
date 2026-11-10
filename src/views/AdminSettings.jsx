'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ChevronLeft, ChevronRight, Search, Rss, Settings2,
  MessageCircle, Send, Mail, Facebook, Youtube, Instagram, KeyRound, Users, UserPlus,
  UserX, UserCheck, PauseCircle,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import {
  getSiteSettings, updateSiteSettings, getUsers, setUserRole, getSources,
  resetUserPassword, sendPasswordResetEmail, setUserStatus,
} from '../services/admin';
import { STATUS_LABELS } from '@/lib/account-status';
import { setAuthCookies } from '../lib/auth-cookies';
import { mergeSiteSettings } from '../lib/site-settings';

const ROLES = ['reader', 'contributor', 'vlogger', 'content_writer', 'admin'];
const LANG_OPTIONS = ['en', 'ml'];
const TABS = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'integrations', label: 'Integrations', icon: MessageCircle },
  { id: 'sources', label: 'Sources', icon: Rss },
  { id: 'users', label: 'Users & RBAC', icon: Users },
];

const ROLE_LABELS = {
  reader: 'Reader',
  contributor: 'Contributor',
  vlogger: 'Vlogger',
  content_writer: 'Content Writer',
  admin: 'Admin',
};

const STATUS_BADGE = {
  active: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300',
  suspended: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  deactivated: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

const WORKER_SECRETS = [
  { key: 'TELEGRAM_BOT_TOKEN', label: 'Telegram bot token', note: 'Required for auto-posting to Telegram' },
  { key: 'RESEND_API_KEY', label: 'Resend API key', note: 'Required for email newsletter digests' },
  { key: 'FACEBOOK_PAGE_TOKEN', label: 'Facebook page token', note: 'Optional — auto-post to Facebook' },
  { key: 'FACEBOOK_PAGE_ID', label: 'Facebook page ID', note: 'Optional — pairs with page token' },
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API key', note: 'Article classification (Claude)' },
  { key: 'WORKER_API_SECRET', label: 'Worker API secret', note: 'Protects manual pipeline triggers' },
];

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm';

const AdminSettings = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, loading, user, refreshUserProfile } = useAuth();
  const urlTab = searchParams.get('tab');
  const tab = TABS.some(t => t.id === urlTab) ? urlTab : 'general';
  const setTab = (nextTab) => {
    const query = nextTab === 'general' ? '' : `?tab=${nextTab}`;
    router.replace(`${pathname}${query}`, { scroll: false });
  };
  const [settings, setSettings] = useState(() => mergeSiteSettings());
  const [settingsReady, setSettingsReady] = useState(false);
  const [users, setUsers] = useState([]);
  const [sourceStats, setSourceStats] = useState({ total: 0, enabled: 0 });
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [cursorStack, setCursorStack] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'reader',
  });
  const [resetModal, setResetModal] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusModal, setStatusModal] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const patchIntegration = (platform, patch) => {
    setSettings(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        [platform]: { ...prev.integrations?.[platform], ...patch },
      },
    }));
  };

  const patchPipeline = (patch) => {
    setSettings(prev => ({
      ...prev,
      pipeline: { ...prev.pipeline, ...patch },
    }));
  };

  const loadUsers = useCallback(async (startAfterDoc = null, reset = false) => {
    setLoadingUsers(true);
    try {
      const result = await getUsers({ pageSize: 25, startAfterDoc, search: appliedSearch, status: statusFilter });
      setUsers(result.users);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
      if (reset) setCursorStack([]);
    } catch (err) {
      toast.error(err.message || 'Could not load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [appliedSearch, statusFilter]);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Settings/sources load once; they must not re-run (and clobber unsaved edits) when filters change.
  useEffect(() => {
    if (!isAdmin) return;
    getSiteSettings()
      .then(value => {
        setSettings(value);
        setSettingsReady(true);
      })
      .catch(err => toast.error(err.message || 'Could not load settings'));
    getSources()
      .then(sources => {
        setSourceStats({
          total: sources.length,
          enabled: sources.filter(s => s.enabled).length,
        });
      })
      .catch(err => toast.error(err.message || 'Could not load sources'));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || tab !== 'users') return;
    loadUsers(null, true);
  }, [isAdmin, tab, loadUsers]);

  const saveSettings = async () => {
    if (!settingsReady) {
      toast.error('Settings are still loading.');
      return;
    }
    try {
      const savedSettings = await updateSiteSettings(settings);
      setSettings(savedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err.message || 'Could not save settings');
    }
  };

  const changeRole = async (userId, role) => {
    if (!ROLES.includes(role)) return;
    try {
      await setUserRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      if (user?.id === userId) {
        const profile = await refreshUserProfile();
        if (profile) {
          setAuthCookies(profile.role || 'reader', {
            emailVerified: profile.emailVerified,
            profileComplete: profile.profileComplete,
          });
        }
      }
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
      // Re-sync the dropdown with the real role after a rejected change.
      loadUsers(cursorStack[cursorStack.length - 1] || null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const { createAdminUser } = await import('../services/admin');
      const created = await createAdminUser(newUser);
      toast.success(`Created ${created.email} as ${ROLE_LABELS[created.role] || created.role}`);
      setNewUser({ email: '', password: '', displayName: '', role: 'reader' });
      await loadUsers(null, true);
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const closeResetModal = () => {
    setResetModal(null);
    setResetPassword('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModal) return;
    setResettingPassword(true);
    try {
      await resetUserPassword(resetModal.id, resetPassword);
      toast.success(`Password reset for ${resetModal.email || resetModal.displayName}`);
      closeResetModal();
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const openStatusModal = (target, nextStatus) => {
    setStatusModal({ user: target, status: nextStatus });
    setStatusReason('');
  };

  const closeStatusModal = () => {
    setStatusModal(null);
    setStatusReason('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModal) return;
    const { user: target, status: nextStatus } = statusModal;
    setUpdatingStatus(true);
    try {
      await setUserStatus(target.id, nextStatus, statusReason);
      setUsers(prev => {
        if (statusFilter !== 'all' && statusFilter !== nextStatus) {
          return prev.filter(u => u.id !== target.id);
        }
        return prev.map(u => u.id === target.id
          ? { ...u, status: nextStatus, status_reason: nextStatus === 'active' ? null : (statusReason.trim() || null) }
          : u);
      });
      toast.success(`${target.email || target.displayName} is now ${STATUS_LABELS[nextStatus].toLowerCase()}`);
      closeStatusModal();
    } catch (err) {
      toast.error(err.message || 'Failed to update account status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendResetEmail = async (userEmail) => {
    if (!userEmail) {
      toast.error('No email on file for this user.');
      return;
    }
    setSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(userEmail);
      toast.success(`Password reset email sent to ${userEmail}`);
      closeResetModal();
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const nextPage = async () => {
    if (!hasMore || !lastDoc) return;
    setCursorStack(prev => [...prev, lastDoc]);
    await loadUsers(lastDoc);
  };

  const prevPage = async () => {
    if (cursorStack.length === 0) {
      await loadUsers(null, true);
      return;
    }
    const stack = [...cursorStack];
    stack.pop();
    const prevCursor = stack[stack.length - 1] || null;
    setCursorStack(stack);
    await loadUsers(prevCursor);
  };

  const i = settings.integrations || {};

  return (
    <AdminLayout
      title="Site Settings"
      actions={
        <button type="button" onClick={saveSettings} disabled={!settingsReady} className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-60">
          {saved ? 'Saved!' : 'Save all changes'}
        </button>
      }
    >

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'general' && (
          <div className="space-y-6">
            <div className="glass-card-solid rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">Publishing</h2>
              <Field label="Quality threshold (0–10)" hint="Minimum AI quality score to publish articles">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={settings.qualityThreshold ?? 6}
                  onChange={e => setSettings({ ...settings, qualityThreshold: parseInt(e.target.value, 10) })}
                  className={`${inputClass} w-24`}
                />
              </Field>
              <Field label="Target languages" hint="Comma-separated language codes for AI content generation">
                <input
                  type="text"
                  value={(settings.targetLanguages || []).join(', ')}
                  onChange={e => setSettings({
                    ...settings,
                    targetLanguages: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                  })}
                  className={inputClass}
                  placeholder="ml"
                />
              </Field>
              <div className="flex flex-wrap gap-2 mt-2">
                {LANG_OPTIONS.map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      const langs = new Set(settings.targetLanguages || []);
                      if (langs.has(code)) langs.delete(code); else langs.add(code);
                      setSettings({ ...settings, targetLanguages: [...langs] });
                    }}
                    className={`text-xs px-2 py-1 rounded-lg border ${
                      (settings.targetLanguages || []).includes(code)
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card-solid rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">Branding</h2>
              <div className="space-y-4">
                <Field label="Site name">
                  <input type="text" value={settings.siteName || ''} onChange={e => setSettings({ ...settings, siteName: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Header text">
                  <input type="text" value={settings.headerText || ''} onChange={e => setSettings({ ...settings, headerText: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Tagline">
                  <input type="text" value={settings.tagline || ''} onChange={e => setSettings({ ...settings, tagline: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Footer text">
                  <input type="text" value={settings.footerText || ''} onChange={e => setSettings({ ...settings, footerText: e.target.value })} className={inputClass} />
                </Field>
              </div>
            </div>

            <div className="glass-card-solid rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-4">Content Pipeline</h2>
              <Toggle label="RSS / article ingest enabled" checked={settings.pipeline?.rssIngestEnabled !== false} onChange={v => patchPipeline({ rssIngestEnabled: v })} />
              <Toggle label="YouTube video fetch enabled" checked={settings.pipeline?.videoFetchEnabled !== false} onChange={v => patchPipeline({ videoFetchEnabled: v })} />
              <p className="text-xs text-gray-500 mt-3">Pipeline toggles are saved to site settings. Workers read them on each run.</p>
            </div>
          </div>
        )}

        {tab === 'integrations' && (
          <div className="space-y-6">
            <div className="glass-card-solid rounded-2xl p-6 border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-bold text-sm mb-2">Worker secrets (Cloudflare)</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    API tokens and bot keys are stored securely in Cloudflare Worker secrets.
                    Set via: <code className="text-brand-600">cd workers && npx wrangler secret put KEY</code>
                  </p>
                  <ul className="space-y-1.5">
                    {WORKER_SECRETS.map(s => (
                      <li key={s.key} className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-mono text-gray-800 dark:text-gray-200">{s.key}</span> — {s.note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass-card-solid rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Send className="w-5 h-5 text-blue-500" />
                <h2 className="font-display font-bold text-lg">Telegram</h2>
              </div>
              <Toggle label="Enabled" checked={i.telegram?.enabled !== false} onChange={v => patchIntegration('telegram', { enabled: v })} />
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Field label="Channel ID" hint="e.g. @TheBharathNews or numeric chat ID">
                  <input type="text" value={i.telegram?.channelId || ''} onChange={e => patchIntegration('telegram', { channelId: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Public channel URL">
                  <input type="url" value={i.telegram?.channelUrl || ''} onChange={e => patchIntegration('telegram', { channelUrl: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Min score to auto-post" hint="Articles at or above this score are posted via bot">
                  <input type="number" min={0} max={10} value={i.telegram?.minScoreToPost ?? 7} onChange={e => patchIntegration('telegram', { minScoreToPost: parseInt(e.target.value, 10) })} className={`${inputClass} w-24`} />
                </Field>
              </div>
            </div>

            <div className="glass-card-solid rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <h2 className="font-display font-bold text-lg">WhatsApp</h2>
              </div>
              <Toggle label="Enabled" checked={i.whatsapp?.enabled !== false} onChange={v => patchIntegration('whatsapp', { enabled: v })} />
              <Toggle label="Show follow CTA on articles" checked={i.whatsapp?.showFollowCta !== false} onChange={v => patchIntegration('whatsapp', { showFollowCta: v })} />
              <Field label="WhatsApp Channel URL" hint="Public channel link shown in footer and article CTAs">
                <input type="url" value={i.whatsapp?.channelUrl || ''} onChange={e => patchIntegration('whatsapp', { channelUrl: e.target.value })} className={inputClass} placeholder="https://whatsapp.com/channel/..." />
              </Field>
            </div>

            <div className="glass-card-solid rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-brand-600" />
                <h2 className="font-display font-bold text-lg">Email / Newsletter</h2>
              </div>
              <Toggle label="Newsletter signup enabled" checked={i.email?.enabled !== false} onChange={v => patchIntegration('email', { enabled: v })} />
              <Toggle label="Weekly digest enabled" checked={i.email?.digestEnabled !== false} onChange={v => patchIntegration('email', { digestEnabled: v })} />
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Field label="From address" hint="Used by Resend when sending digests">
                  <input type="text" value={i.email?.newsletterFrom || ''} onChange={e => patchIntegration('email', { newsletterFrom: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Digest subject line">
                  <input type="text" value={i.email?.digestSubject || ''} onChange={e => patchIntegration('email', { digestSubject: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <Link href="/admin/subscribers" className="inline-block mt-4 text-sm text-brand-600 hover:underline">
                View newsletter subscribers →
              </Link>
            </div>

            <div className="glass-card-solid rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Facebook className="w-5 h-5 text-blue-700" />
                <h2 className="font-display font-bold text-lg">Facebook</h2>
              </div>
              <Toggle label="Show Facebook in footer" checked={i.facebook?.enabled !== false} onChange={v => patchIntegration('facebook', { enabled: v })} />
              <Toggle
                label="Post via Worker Graph API"
                checked={i.facebook?.graphApiEnabled === true}
                onChange={v => patchIntegration('facebook', { graphApiEnabled: v })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-4">
                Keep <strong>Graph API off</strong> when using <strong>dlvr.it</strong> (recommended).
                Use <strong>two separate dlvr.it routes</strong> — English page gets English feed only,
                Malayalam page gets Malayalam feed only. Target <strong>25 posts/day per page</strong>.
              </p>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-4 mb-4 text-xs text-gray-700 dark:text-gray-300 space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-200">dlvr.it settings (each route)</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Updates → Trickle: <strong>Post Newest Items First</strong></li>
                  <li>Updates → Max posts per update: <strong>1</strong> (spreads quota across the day)</li>
                  <li>Updates → Frequency: Every 5 minutes</li>
                  <li>Detail → Post mode: Post Immediately</li>
                </ul>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Field label="Page URL (English)">
                  <input type="url" value={i.facebook?.pageUrl || ''} onChange={e => patchIntegration('facebook', { pageUrl: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Max posts/day per page (dlvr.it)">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    readOnly
                    value={i.facebook?.dlvrItMaxPostsPerDay ?? 25}
                    className={`${inputClass} w-24 bg-gray-50 dark:bg-gray-900`}
                  />
                </Field>
                <Field label="dlvr.it RSS — English page only">
                  <input
                    type="url"
                    readOnly
                    value={i.facebook?.dlvrItEnglishFeedUrl || 'https://www.thebharathnews.com/feed.xml?lang=en&limit=25&hours=24'}
                    className={`${inputClass} bg-gray-50 dark:bg-gray-900`}
                  />
                </Field>
                <Field label="dlvr.it RSS — Malayalam page only">
                  <input
                    type="url"
                    readOnly
                    value={i.facebook?.dlvrItMalayalamFeedUrl || i.facebook?.dlvrItFeedUrl || 'https://www.thebharathnews.com/feed/social-ml.xml'}
                    className={`${inputClass} bg-gray-50 dark:bg-gray-900`}
                  />
                </Field>
                <Field label="Min score (Graph API only)">
                  <input type="number" min={0} max={10} value={i.facebook?.minScoreToPost ?? 7} onChange={e => patchIntegration('facebook', { minScoreToPost: parseInt(e.target.value, 10) })} className={`${inputClass} w-24`} />
                </Field>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="glass-card-solid rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Youtube className="w-5 h-5 text-red-600" />
                  <h2 className="font-display font-bold text-lg">YouTube</h2>
                </div>
                <Toggle label="Show in footer" checked={i.youtube?.enabled !== false} onChange={v => patchIntegration('youtube', { enabled: v })} />
                <Field label="Channel URL">
                  <input type="url" value={i.youtube?.channelUrl || ''} onChange={e => patchIntegration('youtube', { channelUrl: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="glass-card-solid rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <h2 className="font-display font-bold text-lg">Instagram</h2>
                </div>
                <Toggle label="Show in footer" checked={i.instagram?.enabled !== false} onChange={v => patchIntegration('instagram', { enabled: v })} />
                <Field label="Profile URL">
                  <input type="url" value={i.instagram?.profileUrl || ''} onChange={e => patchIntegration('instagram', { profileUrl: e.target.value })} className={inputClass} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {tab === 'sources' && (
          <div className="space-y-6">
            <div className="glass-card-solid rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-2">RSS & Article Sources</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {sourceStats.enabled} of {sourceStats.total} sources enabled. The ingest worker reads enabled sources from the database every 15 minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin/sources" className="btn-primary px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2">
                  <Rss className="w-4 h-4" /> Manage Sources
                </Link>
                <Link href="/admin/videos" className="btn-secondary px-4 py-2 rounded-xl text-sm">
                  Manage Video Channels
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Add RSS feeds, Google News sources, and configure language/category per source. Disabled sources are skipped by the ingest pipeline.
              </p>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-6">
          <div className="glass-card-solid rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-brand-600" />
              <h2 className="font-display font-bold text-lg">Create User</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create an account with email/password and assign an RBAC role. The user can sign in immediately at /login.
            </p>
            <form onSubmit={handleCreateUser} className="grid sm:grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className={inputClass}
                  placeholder="user@example.com"
                />
              </Field>
              <Field label="Password" hint="Minimum 8 characters">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </Field>
              <Field label="Display name">
                <input
                  type="text"
                  value={newUser.displayName}
                  onChange={e => setNewUser(prev => ({ ...prev, displayName: e.target.value }))}
                  className={inputClass}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Role">
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className={inputClass}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-60"
                >
                  {creatingUser ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card-solid rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-display font-bold text-lg">Manage Users</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deactivated">Deactivated</option>
                </select>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search users…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setAppliedSearch(search)}
                    className="pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent w-full sm:w-56"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              <strong>Suspended</strong> = temporary block. <strong>Deactivated</strong> = account closed. Both stop sign-in and
              API access until an admin reactivates the account.
            </p>
            <div className="space-y-2 max-h-[32rem] overflow-y-auto mb-4">
              {loadingUsers ? (
                <p className="text-sm text-gray-500 py-4 text-center">Loading users…</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No users found</p>
              ) : users.map(u => {
                const accountStatus = u.status || 'active';
                const isSelf = u.id === user?.id;
                return (
                  <div key={u.id} className="py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium truncate">{u.displayName || u.email}</p>
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[accountStatus] || STATUS_BADGE.active}`}>
                            {STATUS_LABELS[accountStatus] || accountStatus}
                          </span>
                          {isSelf && <span className="text-[10px] text-gray-400 flex-shrink-0">(you)</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        {accountStatus !== 'active' && u.status_reason && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate" title={u.status_reason}>Reason: {u.status_reason}</p>
                        )}
                      </div>
                      <select
                        value={u.role || 'reader'}
                        onChange={e => changeRole(u.id, e.target.value)}
                        aria-label={`Role for ${u.email}`}
                        className="text-sm px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent flex-shrink-0"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => { setResetModal(u); setResetPassword(''); }}
                        className="btn-secondary text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Change password
                      </button>
                      {accountStatus === 'active' ? (
                        <>
                          <button
                            type="button"
                            disabled={isSelf}
                            title={isSelf ? "You can't suspend your own account" : 'Temporarily block this user'}
                            onClick={() => openStatusModal(u, 'suspended')}
                            className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <PauseCircle className="w-3.5 h-3.5" /> Suspend
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            title={isSelf ? "You can't deactivate your own account" : 'Close this account'}
                            onClick={() => openStatusModal(u, 'deactivated')}
                            className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <UserX className="w-3.5 h-3.5" /> Deactivate
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openStatusModal(u, 'active')}
                          className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={prevPage} disabled={cursorStack.length === 0 && users.length === 0} className="btn-secondary text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button type="button" onClick={nextPage} disabled={!hasMore} className="btn-secondary text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-40">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        )}

      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="glass-card-solid rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display font-bold text-lg mb-2">Change Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Set a new password for <strong>{resetModal.email || resetModal.displayName}</strong>.
              Share it with the user securely; they can change it after signing in.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Minimum 8 characters"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="btn-primary px-4 py-2 rounded-xl text-sm disabled:opacity-60"
                >
                  {resettingPassword ? 'Resetting…' : 'Set New Password'}
                </button>
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="btn-secondary px-4 py-2 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs text-gray-500 mb-2">Or send the user a reset link via email:</p>
              <button
                type="button"
                onClick={() => handleSendResetEmail(resetModal.email)}
                disabled={sendingResetEmail}
                className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-60"
              >
                <Mail className="w-3 h-3" /> {sendingResetEmail ? 'Sending…' : 'Send reset email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="glass-card-solid rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display font-bold text-lg mb-2">
              {statusModal.status === 'active' && 'Reactivate account'}
              {statusModal.status === 'suspended' && 'Suspend account'}
              {statusModal.status === 'deactivated' && 'Deactivate account'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {statusModal.status === 'active'
                ? <>Restore sign-in and access for <strong>{statusModal.user.email || statusModal.user.displayName}</strong>.</>
                : <><strong>{statusModal.user.email || statusModal.user.displayName}</strong> will be signed out and blocked from signing in until an admin reactivates the account.</>}
            </p>
            <form onSubmit={handleStatusSubmit} className="space-y-3">
              {statusModal.status !== 'active' && (
                <div>
                  <label htmlFor="status-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason (optional, visible to admins only)
                  </label>
                  <textarea
                    id="status-reason"
                    rows={3}
                    maxLength={300}
                    value={statusReason}
                    onChange={e => setStatusReason(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Violated community guidelines"
                    autoFocus
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className={`px-4 py-2 rounded-xl text-sm text-white disabled:opacity-60 ${
                    statusModal.status === 'active' ? 'bg-green-600 hover:bg-green-700'
                      : statusModal.status === 'suspended' ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {updatingStatus ? 'Saving…' : statusModal.status === 'active' ? 'Reactivate' : statusModal.status === 'suspended' ? 'Suspend user' : 'Deactivate user'}
                </button>
                <button type="button" onClick={closeStatusModal} disabled={updatingStatus} className="btn-secondary px-4 py-2 rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
