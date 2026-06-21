'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Search, Rss, Settings2,
  MessageCircle, Send, Mail, Facebook, Youtube, Instagram, KeyRound, Users, UserPlus,
} from 'lucide-react';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';
import {
  getSiteSettings, updateSiteSettings, getUsers, setUserRole, getSources,
} from '../services/admin';
import { setAuthCookies } from '../lib/auth-cookies';
import { mergeSiteSettings } from '../lib/site-settings';

const ROLES = ['reader', 'contributor', 'vlogger', 'content_writer', 'admin'];
const LANG_OPTIONS = ['en', 'hi', 'ml', 'ta', 'kn', 'te', 'bn'];
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
  const { isAdmin, loading, user, refreshUserProfile } = useAuth();
  const [tab, setTab] = useState(() => {
    const initial = searchParams.get('tab');
    return TABS.some(t => t.id === initial) ? initial : 'general';
  });
  const [settings, setSettings] = useState(() => mergeSiteSettings());
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
      const result = await getUsers({ pageSize: 25, startAfterDoc, search });
      setUsers(result.users);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
      if (reset) setCursorStack([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [search]);

  useEffect(() => {
    if (isAdmin) {
      getSiteSettings().then(setSettings);
      getSources().then(sources => {
        setSourceStats({
          total: sources.length,
          enabled: sources.filter(s => s.enabled).length,
        });
      });
      loadUsers(null, true);
    }
  }, [isAdmin, loadUsers]);

  const saveSettings = async () => {
    await updateSiteSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changeRole = async (userId, role) => {
    if (!ROLES.includes(role)) return;
    try {
      await setUserRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      if (user?.uid === userId) {
        const profile = await refreshUserProfile();
        if (profile) setAuthCookies(profile.role || 'reader');
      }
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
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

  if (loading) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt nextPath="/admin/settings" showAdminHint />
        </div>
      </Layout>
    );
  }

  const i = settings.integrations || {};

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="font-display font-bold text-3xl">Site Settings</h1>
          <button type="button" onClick={saveSettings} className="btn-primary px-5 py-2 rounded-xl text-sm">
            {saved ? 'Saved!' : 'Save all changes'}
          </button>
        </div>

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
                  placeholder="ml, hi, ta, te, kn, bn"
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
              <p className="text-xs text-gray-500 mt-3">Pipeline toggles are stored in Firestore. Workers read these on each run.</p>
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
                    API tokens and bot keys are stored securely in Cloudflare Worker secrets, not in Firestore.
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
                    value={i.facebook?.dlvrItMalayalamFeedUrl || i.facebook?.dlvrItFeedUrl || 'https://www.thebharathnews.com/feed.xml?lang=ml&limit=25&hours=24'}
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
                {sourceStats.enabled} of {sourceStats.total} sources enabled. The ingest worker reads enabled sources from Firestore every 15 minutes.
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
              Create a Firebase account with email/password and assign an RBAC role. The user can sign in immediately at /login.
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
              <h2 className="font-display font-bold text-lg">Manage Roles</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search users…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadUsers(null, true)}
                  className="pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent w-full sm:w-56"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {loadingUsers ? (
                <p className="text-sm text-gray-500 py-4 text-center">Loading users…</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No users found</p>
              ) : users.map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.displayName || u.email}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <select
                    value={u.role || 'reader'}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className="text-sm px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent flex-shrink-0"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                  </select>
                </div>
              ))}
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
      </div>
    </Layout>
  );
};

export default AdminSettings;
