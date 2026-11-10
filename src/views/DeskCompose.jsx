'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import DeskGate from '../components/DeskGate';
import CoverImagePicker from '../components/CoverImagePicker';
import StaffAuthorPicker from '../components/StaffAuthorPicker';
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
  isAiAssisted: true,
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
          isAiAssisted: article.isAiAssisted !== false,
          scheduledAt: toLocalInput(article._scheduledAtIso),
          translationTitle: other.title || '',
          translationSummary: other.summary || '',
          translationBody: other.fullContent || '',
        });
      })
      .catch(err => toast.error(err.message || 'Could not open this draft.'));
  }, [draftId]);

  const payload = (publishNow = false) => ({
    title: form.title,
    summary: form.summary,
    fullContent: form.fullContent,
    category: form.category,
    language: form.language,
    author: form.author,
    authorSlug: form.authorSlug,
    authorPhotoUrl: form.authorPhotoUrl,
    authorTitle: form.authorTitle,
    tags: form.tags,
    imageUrl: form.imageUrl,
    imageCredit: form.imageCredit,
    isAiAssisted: form.isAiAssisted,
    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
    publishNow,
    translation: {
      lang: form.language === 'ml' ? 'en' : 'ml',
      title: form.translationTitle,
      summary: form.translationSummary,
      fullContent: form.translationBody,
    },
  });

  const save = async (publishNow = false) => {
    setSaving(true);
    try {
      const data = draftId
        ? await deskFetch(`/api/desk/articles/${draftId}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'update', ...payload(false) }),
        })
        : await deskFetch('/api/desk/articles', {
          method: 'POST',
          body: JSON.stringify(payload(publishNow)),
        });
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
    <DeskGate>
      <Layout showBottomNav={false} mainClassName="max-w-3xl mx-auto px-4 py-10">
        <Link href="/desk" className="text-sm text-brand-700 dark:text-brand-300">Newsroom</Link>
        <h1 className="font-display font-bold text-3xl mt-2">{draftId ? 'Edit draft' : 'Compose'}</h1>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          Paste the Claude co-work draft here. It stays unpublished until someone approves it on the review queue.
        </p>
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
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isAiAssisted} onChange={e => set('isAiAssisted', e.target.checked)} />
              Mark as AI-assisted
            </label>
            <Link href="/admin/staff" className="inline-block text-xs text-brand-700 dark:text-brand-300">Manage editorial staff</Link>
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
            <p className="text-xs text-gray-500">Optional. Readers can switch language on the article when this is filled in.</p>
            <input value={form.translationTitle} onChange={e => set('translationTitle', e.target.value)} placeholder={`${otherLabel} title`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            <textarea value={form.translationSummary} onChange={e => set('translationSummary', e.target.value)} rows={2} placeholder={`${otherLabel} summary`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            <textarea value={form.translationBody} onChange={e => set('translationBody', e.target.value)} rows={8} placeholder={`${otherLabel} full content`} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 rounded-xl disabled:opacity-50">Save draft</button>
            {isAdmin && !draftId && (
              <button type="button" disabled={saving} onClick={() => save(true)} className="btn-secondary px-5 py-2.5 rounded-xl disabled:opacity-50">Publish now</button>
            )}
            <Link href="/desk/review" className="px-5 py-2.5 text-sm text-gray-500">Review queue</Link>
          </div>
        </form>
      </Layout>
    </DeskGate>
  );
};

export default DeskCompose;
