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
  translationTitle: '',
  translationSummary: '',
  translationBody: '',
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
  const { isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id') || '';
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!draftId) return;
    deskFetch(`/api/desk/articles/${draftId}`)
      .then(({ article }) => {
        const otherCode = article.language === 'ml' ? 'en' : 'ml';
        const other = article.translations?.[otherCode] || {};
        setForm({
          title: article.title || '',
          summary: article.summary || '',
          fullContent: article.fullContent || '',
          category: article.category || 'india',
          language: article.language === 'ml' ? 'ml' : 'en',
          author: article.author || 'Bharath News Desk',
          authorSlug: article.authorSlug || 'bharath-news-desk',
          authorPhotoUrl: article.authorPhotoUrl || '',
          authorTitle: article.authorTitle || '',
          tags: (article.topics || []).join(', '),
          imageUrl: article.imageUrl && !isStoredPlaceholderImage(article.imageUrl) ? article.imageUrl : '',
          imageCredit: article.imageCredit || '',
          scheduledAt: toLocalInput(article._scheduledAtIso),
          translationTitle: other.title || '',
          translationSummary: other.summary || '',
          translationBody: other.fullContent || '',
        });
      })
      .catch(err => toast.error(err.message || 'Could not open this draft.'));
  }, [draftId]);

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
    translation: {
      lang: form.language === 'ml' ? 'en' : 'ml',
      title: form.translationTitle,
      summary: form.translationSummary,
      fullContent: form.translationBody,
    },
  });

  const save = async (publishNow = false, publishing = null) => {
    setSaving(true);
    try {
      const data = draftId
        ? await deskFetch(`/api/desk/articles/${draftId}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'update', ...payload(false) }),
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

  const otherLabel = form.language === 'ml' ? 'English' : 'Malayalam';

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
          <label className="block text-sm font-medium">
            Title
            <input required value={form.title} onChange={e => set('title', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">
            Summary
            <textarea value={form.summary} onChange={e => set('summary', e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
          </label>
          <label className="block text-sm font-medium">
            Full content
            <textarea required value={form.fullContent} onChange={e => set('fullContent', e.target.value)} rows={14} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              Language of this draft
              <select value={form.language} onChange={e => set('language', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                <option value="en">English</option>
                <option value="ml">Malayalam</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Category
              <select value={form.category} onChange={e => set('category', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {contentCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          </div>
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
          <div className="rounded-2xl border border-stone-200 dark:border-white/10 p-4 space-y-3">
            <h2 className="font-display font-bold">{otherLabel} version</h2>
            <p className="text-xs text-gray-500">Required before publishing. Every story goes live in both English and Malayalam.</p>
            <input value={form.translationTitle} onChange={e => set('translationTitle', e.target.value)} placeholder={`${otherLabel} title`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            <textarea value={form.translationSummary} onChange={e => set('translationSummary', e.target.value)} rows={2} placeholder={`${otherLabel} summary`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            <textarea value={form.translationBody} onChange={e => set('translationBody', e.target.value)} rows={8} placeholder={`${otherLabel} full content`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 rounded-xl disabled:opacity-50">Save draft</button>
            {isAdmin && !draftId && (
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
            translations: {
              [form.language === 'ml' ? 'en' : 'ml']: { title: form.translationTitle, fullContent: form.translationBody },
            },
          })}
          busy={saving}
          onCancel={() => setPublishOpen(false)}
          onConfirm={publishing => save(true, publishing)}
        />
    </DeskLayout>
  );
};

export default DeskCompose;
