'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import DeskLayout from '../components/DeskLayout';
import CoverImagePicker from '../components/CoverImagePicker';
import StaffAuthorPicker from '../components/StaffAuthorPicker';
import PublishDialog, { languageStatus } from '../components/PublishDialog';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { capsAllow } from '@/lib/access-roles';
import { CATEGORIES } from '../config/feeds.config';
import { deskFetch } from '@/lib/desk-client';
import { isStoredPlaceholderImage } from '@/utils/articleImages';

const EMPTY = {
  title: '',
  summary: '',
  fullContent: '',
  category: 'india',
  language: 'en',
  author: 'Bharath News Desk',
  authorSlug: 'bharath-news-desk',
  authorPhotoUrl: '',
  authorTitle: 'Newsroom',
  tags: '',
  imageUrl: '',
  imageCredit: '',
  scheduledAt: '',
  versions: {},
};

const contentCategories = CATEGORIES.filter(item => item.id !== 'all');

function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const DeskCompose = () => {
  const { isAdmin, caps } = useAuth();
  const { settings } = useSiteSettings();
  const canPublish = capsAllow(caps, 'publish');
  const canCorrect = capsAllow(caps, 'correct');
  const languages = settings.newsroom.languages;
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id') || '';
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [status, setStatus] = useState('draft');
  const [revisions, setRevisions] = useState([]);
  const languageKey = languages.map(item => `${item.code}:${item.label}`).join('|');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!draftId) return;
    deskFetch(`/api/desk/articles/${draftId}`)
      .then(({ article, revisions: history }) => {
        const codes = languages.map(item => item.code);
        const language = codes.includes(article.language) ? article.language : (codes[0] || 'en');
        const versions = {};
        for (const item of languages) {
          if (item.code === language) continue;
          const version = article.translations?.[item.code] || {};
          versions[item.code] = {
            title: version.title || '',
            summary: version.summary || '',
            fullContent: version.fullContent || '',
          };
        }
        setStatus(article.editorialStatus || 'draft');
        setRevisions(history || []);
        setForm({
          title: article.title || '',
          summary: article.summary || '',
          fullContent: article.fullContent || '',
          category: article.category || settings.newsroom.defaultCategory || 'india',
          language,
          author: article.author || 'Bharath News Desk',
          authorSlug: article.authorSlug || 'bharath-news-desk',
          authorPhotoUrl: article.authorPhotoUrl || '',
          authorTitle: article.authorTitle || '',
          tags: (article.topics || []).join(', '),
          imageUrl: article.imageUrl && !isStoredPlaceholderImage(article.imageUrl) ? article.imageUrl : '',
          imageCredit: article.imageCredit || '',
          scheduledAt: toLocalInput(article._scheduledAtIso),
          versions,
        });
      })
      .catch(err => toast.error(err.message || 'Could not open this draft.'));
  }, [draftId, languageKey, languages, settings.newsroom.defaultCategory]);

  const payload = (publishNow = false, publishing = null) => ({
    title: form.title,
    summary: form.summary,
    fullContent: form.fullContent,
    category: publishing?.category || form.category,
    publisherSlug: publishing?.publisherSlug || '',
    language: form.language,
    author: form.author,
    authorSlug: form.authorSlug,
    authorPhotoUrl: form.authorPhotoUrl,
    authorTitle: form.authorTitle,
    tags: form.tags,
    imageUrl: form.imageUrl,
    imageCredit: form.imageCredit,
    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    publishNow,
    translations: form.versions,
  });

  const save = async (publishNow = false, publishing = null) => {
    setSaving(true);
    try {
      const data = draftId
        ? await deskFetch(`/api/desk/articles/${draftId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            action: status === 'published' ? 'correct' : 'update',
            correctionNote: 'Updated after publication.',
            ...payload(false),
          }),
        })
        : await deskFetch('/api/desk/articles', {
          method: 'POST',
          body: JSON.stringify(payload(publishNow, publishing)),
        });
      setPublishOpen(false);
      toast.success(publishNow ? 'Published.' : 'Draft saved for review.');
      if (!draftId && data.article?.id && !publishNow) {
        window.history.replaceState(null, '', `/desk/compose?id=${data.article.id}`);
      }
      if (publishNow && data.article?.slug) {
        window.location.assign(`/article/${data.article.slug}`);
      }
    } catch (err) {
      toast.error(err.message || 'Could not save.');
    }
    setSaving(false);
  };

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id.startsWith('version-')) return;
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    }, 50);
    return () => clearTimeout(timer);
  }, [draftId, form.title, form.language]);

  const otherLanguages = languages.filter(item => item.code !== form.language);
  const primaryLanguage = languages.find(item => item.code === form.language) || { code: form.language, label: 'This language' };
  const versionState = languageStatus({
    language: form.language,
    title: form.title,
    fullContent: form.fullContent,
    translations: form.versions,
    catalog: languages,
  });
  const versionNames = languages.map(item => item.label);
  const versionLabel = versionNames.length < 2
    ? (versionNames[0] || 'this language')
    : `${versionNames.slice(0, -1).join(', ')} and ${versionNames[versionNames.length - 1]}`;
  const changeLanguage = (nextCode) => {
    setForm(prev => {
      if (nextCode === prev.language) return prev;
      const versions = { ...(prev.versions || {}) };
      versions[prev.language] = {
        title: prev.title,
        summary: prev.summary,
        fullContent: prev.fullContent,
      };
      const next = versions[nextCode] || { title: '', summary: '', fullContent: '' };
      delete versions[nextCode];
      return {
        ...prev,
        language: nextCode,
        title: next.title || '',
        summary: next.summary || '',
        fullContent: next.fullContent || '',
        versions,
      };
    });
  };

  const setVersion = (code, field, value) => {
    setForm(prev => ({
      ...prev,
      versions: {
        ...prev.versions,
        [code]: { title: '', summary: '', fullContent: '', ...(prev.versions?.[code] || {}), [field]: value },
      },
    }));
  };

  return (
    <DeskLayout
      title={draftId ? 'Edit draft' : 'Compose'}
      description="Paste the co-work draft here. It stays unpublished until someone approves it on the review queue."
      maxWidth="max-w-3xl"
    >
        <form
          className="space-y-5"
          onSubmit={e => {
            e.preventDefault();
            save(false);
          }}
        >
          <div id={`version-${primaryLanguage.code}`} className="rounded-2xl border border-stone-200 dark:border-white/10 p-4 space-y-3 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold">{primaryLanguage.label} version</h2>
              <p className="text-xs text-gray-500">
                {versionState.map(item => `${item.label} ${item.ready ? 'ready' : 'missing a title or full story'}`).join(' · ')}
              </p>
            </div>
            <label className="block text-sm font-medium">
              Language of this version
              <select value={form.language} onChange={e => changeLanguage(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              {primaryLanguage.label} title
              <input required value={form.title} onChange={e => set('title', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            </label>
            <label className="block text-sm font-medium">
              {primaryLanguage.label} summary
              <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            </label>
            <label className="block text-sm font-medium">
              {primaryLanguage.label} full story
              <textarea required value={form.fullContent} onChange={e => set('fullContent', e.target.value)} rows={14} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            </label>
          </div>
          {otherLanguages.map(item => {
            const version = form.versions?.[item.code] || {};
            const ready = versionState.find(entry => entry.code === item.code)?.ready;
            return (
              <div key={item.code} id={`version-${item.code}`} className={`rounded-2xl border p-4 space-y-3 scroll-mt-24 ${ready ? 'border-stone-200 dark:border-white/10' : 'border-red-300 dark:border-red-800'}`}>
                <h2 className="font-display font-bold">{item.label} version</h2>
                <p className="text-xs text-gray-500">
                  {ready ? 'Ready.' : 'Missing a title or full story.'} Every story goes live in {versionLabel}.
                </p>
                <input value={version.title || ''} onChange={e => setVersion(item.code, 'title', e.target.value)} placeholder={`${item.label} title`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
                <textarea value={version.summary || ''} onChange={e => setVersion(item.code, 'summary', e.target.value)} rows={2} placeholder={`${item.label} summary`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
                <textarea value={version.fullContent || ''} onChange={e => setVersion(item.code, 'fullContent', e.target.value)} rows={8} placeholder={`${item.label} full story`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
              </div>
            );
          })}
          <label className="block text-sm font-medium">
            Category
            <select value={form.category} onChange={e => set('category', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
              {contentCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <div className="rounded-2xl border border-stone-200 dark:border-white/10 p-4 space-y-3">
            <StaffAuthorPicker
              value={form}
              onChange={next => setForm(prev => ({ ...prev, ...next }))}
            />
            {isAdmin && (
              <Link href="/admin/staff" className="inline-block text-xs text-brand-700 dark:text-brand-300">Manage editorial staff</Link>
            )}
          </div>
          <div className="rounded-2xl border border-stone-200 dark:border-white/10 p-4 space-y-3">
            <h2 className="font-display font-bold">Cover image</h2>
            <CoverImagePicker
              category={form.category}
              imageUrl={form.imageUrl}
              imageCredit={form.imageCredit}
              onChange={next => setForm(prev => ({ ...prev, ...next }))}
            />
          </div>
          <label className="block text-sm font-medium">
            Tags
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="gulf, kerala, gold" className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">
            Schedule, optional
            <input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
          </label>
          {revisions.length > 0 && (
            <div className="rounded-2xl border border-stone-200 dark:border-white/10 p-4">
              <h2 className="font-display font-bold mb-2">Earlier versions</h2>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {revisions.map(item => (
                  <li key={item.id}>
                    {item.reason || 'edit'} · {item.status || 'draft'} · {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving || (status === 'published' && !canCorrect)} className="btn-primary px-5 py-2.5 rounded-xl disabled:opacity-50">
              {status === 'published' ? 'Save correction' : 'Save draft'}
            </button>
            {canPublish && !draftId && (
              <button type="button" disabled={saving} onClick={() => setPublishOpen(true)} className="btn-secondary px-5 py-2.5 rounded-xl disabled:opacity-50">Publish now</button>
            )}
            <Link href="/desk/review" className="px-5 py-2.5 text-sm text-gray-500">Review queue</Link>
          </div>
        </form>
        <PublishDialog
          open={publishOpen}
          title={form.title}
          category={form.category}
          authorSlug={form.authorSlug}
          languages={languageStatus({
            language: form.language,
            title: form.title,
            fullContent: form.fullContent,
            translations: form.versions,
            catalog: languages,
          })}
          busy={saving}
          onCancel={() => setPublishOpen(false)}
          onConfirm={publishing => save(true, publishing)}
        />
    </DeskLayout>
  );
};

export default DeskCompose;
