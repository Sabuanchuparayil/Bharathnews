'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../config/feeds.config';
import { deskFetch } from '@/lib/desk-client';

const contentCategories = CATEGORIES.filter(item => item.id !== 'all');

function joinLabels(labels) {
  if (labels.length < 2) return labels[0] || 'The other language';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

function hasVersion(title, body) {
  return String(title || '').trim().length >= 4 && String(body || '').trim().length >= 40;
}

/** Ready state for each newsroom language on a draft or saved article. */
export function languageStatus({ language, title, fullContent, translations, catalog }) {
  const codes = catalog?.length ? catalog : [
    { code: 'en', label: 'English' },
    { code: 'ml', label: 'Malayalam' },
  ];
  const primary = codes.some(item => item.code === language) ? language : codes[0].code;
  return codes.map(item => {
    if (item.code === primary) {
      return { code: item.code, label: item.label, ready: hasVersion(title, fullContent) };
    }
    const version = translations?.[item.code] || {};
    return { code: item.code, label: item.label, ready: hasVersion(version.title, version.fullContent) };
  });
}

export default function PublishDialog({
  open,
  title,
  category,
  categories,
  authorSlug,
  languages,
  busy,
  storyLanguage,
  initialSkipEnglish,
  onCancel,
  onConfirm,
  fixHref,
}) {
  const [board, setBoard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [publisherSlug, setPublisherSlug] = useState('');
  const [chosenCategories, setChosenCategories] = useState([]);
  const [skipEnglish, setSkipEnglish] = useState(false);

  useEffect(() => {
    if (!open) return;
    const incoming = Array.isArray(categories) && categories.length
      ? categories
      : (category ? [category] : []);
    setChosenCategories([...new Set(incoming.filter(item => item && item !== 'all'))].slice(0, 4));
    setSkipEnglish(Boolean(initialSkipEnglish) && storyLanguage !== 'en');
    setBoardError('');
    setLoadingBoard(true);
    deskFetch('/api/desk/staff')
      .then(data => {
        const members = data.staff || [];
        setBoard(members);
        setPublisherSlug(members.some(member => member.slug === authorSlug) ? authorSlug : '');
      })
      .catch(err => setBoardError(err.message || 'Could not load the editorial board.'))
      .finally(() => setLoadingBoard(false));
  }, [open, category, categories, authorSlug, initialSkipEnglish, storyLanguage]);

  if (!open) return null;

  const waiveEnglish = skipEnglish && storyLanguage !== 'en';
  const kept = (languages || []).filter(item => item.code !== 'en').map(item => item.label);
  const keptLabel = joinLabels(kept);
  const rows = (languages || []).map(item => ({
    ...item,
    skipped: item.code === 'en' && waiveEnglish,
  }));
  const missing = rows.filter(item => !item.skipped && !item.ready);
  const toggleCategory = (id) => {
    setChosenCategories(prev => {
      if (prev.includes(id)) return prev.length === 1 ? prev : prev.filter(item => item !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };
  const canPublish = !busy && !loadingBoard && publisherSlug && chosenCategories.length > 0 && missing.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="glass-card-solid rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title">
        <h3 id="publish-dialog-title" className="font-display font-bold text-lg">Publish story</h3>
        {title && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{title}</p>}

        <section className="mt-5">
          <h4 className="text-sm font-semibold">Language versions</h4>
          <ul className="mt-2 space-y-1">
            {rows.map(item => (
              <li key={item.code} className="flex items-center gap-2 text-sm">
                {item.skipped || item.ready
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <XCircle className="w-4 h-4 text-red-600" />}
                {item.label} {item.skipped ? 'not required for this story' : item.ready ? 'ready' : 'missing a title or full story'}
              </li>
            ))}
          </ul>
          {storyLanguage !== 'en' && (
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipEnglish}
                onChange={e => setSkipEnglish(e.target.checked)}
                className="mt-1"
              />
              <span>This story does not need an English version. {keptLabel} {kept.length === 1 ? 'is' : 'are'} still required.</span>
            </label>
          )}
          {missing.length > 0 && (
            <p className="mt-2 text-xs text-red-600">
              {missing.map(item => item.label).join(' and ')} {missing.length === 1 ? 'is' : 'are'} required.{' '}
              {fixHref && <a href={`${fixHref}#version-${missing[0].code}`} className="underline">Edit the draft</a>}
            </p>
          )}
        </section>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Categories</legend>
          <p className="text-xs text-gray-500 mt-0.5">Tick every section this story belongs to. Up to four.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {contentCategories.map(item => (
              <label key={item.id} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${chosenCategories.includes(item.id) ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40' : 'border-stone-200 dark:border-white/10'}`}>
                <input
                  type="checkbox"
                  checked={chosenCategories.includes(item.id)}
                  onChange={() => toggleCategory(item.id)}
                />
                {item.name}
              </label>
            ))}
          </div>
        </fieldset>

        <section className="mt-5">
          <h4 className="text-sm font-semibold">Published by</h4>
          <p className="text-xs text-gray-500 mt-0.5">This editorial board member appears as the byline.</p>
          {loadingBoard && (
            <p className="mt-3 text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading the editorial board</p>
          )}
          {boardError && <p className="mt-3 text-sm text-red-600">{boardError}</p>}
          {!loadingBoard && !boardError && board.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">No active board members. Add them in Admin → Staff.</p>
          )}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {board.map(person => {
              const active = publisherSlug === person.slug;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setPublisherSlug(person.slug)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                    active
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40'
                      : 'border-stone-200 dark:border-white/10 hover:border-brand-400'
                  }`}
                >
                  {person.photoURL ? (
                    <img src={person.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 flex items-center justify-center font-semibold">
                      {(person.displayName || '?').slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{person.displayName}</span>
                    <span className="block text-xs text-gray-500 truncate">{person.title || 'Reporter'}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="px-4 py-2 rounded-xl text-sm border border-stone-200 dark:border-white/10">Cancel</button>
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => onConfirm({ publisherSlug, category: chosenCategories[0], categories: chosenCategories, skipEnglish: waiveEnglish })}
            className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm disabled:opacity-50"
          >
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
