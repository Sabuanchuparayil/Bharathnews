'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../config/feeds.config';
import { deskFetch } from '@/lib/desk-client';

const contentCategories = CATEGORIES.filter(item => item.id !== 'all');

function hasVersion(title, body) {
  return String(title || '').trim().length >= 4 && String(body || '').trim().length >= 40;
}

/** Ready state for the English and Malayalam versions of a draft or saved article. */
export function languageStatus({ language, title, fullContent, translations }) {
  const primary = language === 'ml' ? 'ml' : 'en';
  const other = primary === 'en' ? 'ml' : 'en';
  const version = translations?.[other] || {};
  const ready = {
    [primary]: hasVersion(title, fullContent),
    [other]: hasVersion(version.title, version.fullContent),
  };
  return [
    { code: 'en', label: 'English', ready: ready.en },
    { code: 'ml', label: 'Malayalam', ready: ready.ml },
  ];
}

export default function PublishDialog({
  open,
  title,
  category,
  authorSlug,
  languages,
  busy,
  onCancel,
  onConfirm,
  fixHref,
}) {
  const [board, setBoard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [publisherSlug, setPublisherSlug] = useState('');
  const [chosenCategory, setChosenCategory] = useState(category || '');

  useEffect(() => {
    if (!open) return;
    setChosenCategory(category || '');
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
  }, [open, category, authorSlug]);

  if (!open) return null;

  const missing = (languages || []).filter(item => !item.ready);
  const canPublish = !busy && !loadingBoard && publisherSlug && chosenCategory && missing.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="glass-card-solid rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="publish-dialog-title">
        <h3 id="publish-dialog-title" className="font-display font-bold text-lg">Publish story</h3>
        {title && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{title}</p>}

        <section className="mt-5">
          <h4 className="text-sm font-semibold">Language versions</h4>
          <ul className="mt-2 space-y-1">
            {(languages || []).map(item => (
              <li key={item.code} className="flex items-center gap-2 text-sm">
                {item.ready
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <XCircle className="w-4 h-4 text-red-600" />}
                {item.label} {item.ready ? 'ready' : 'missing a title or full story'}
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <p className="mt-2 text-xs text-red-600">
              Both English and Malayalam are required.{' '}
              {fixHref && <a href={fixHref} className="underline">Edit the draft</a>}
            </p>
          )}
        </section>

        <label className="block mt-5 text-sm font-semibold">
          Category
          <select
            value={chosenCategory}
            onChange={e => setChosenCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm font-normal"
          >
            <option value="">Choose a category</option>
            {contentCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

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
            onClick={() => onConfirm({ publisherSlug, category: chosenCategory })}
            className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm disabled:opacity-50"
          >
            {busy ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
