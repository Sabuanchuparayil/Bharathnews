'use client';

import React, { useEffect, useState } from 'react';
import { deskFetch } from '@/lib/desk-client';

export default function StaffAuthorPicker({ value, onChange }) {
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    deskFetch('/api/desk/staff')
      .then(data => setStaff(data.staff || []))
      .catch(err => setError(err.message || 'Could not load reporters.'));
  }, []);

  const selectedSlug = value?.authorSlug || '';

  return (
    <div className="space-y-3">
      <h2 className="font-display font-bold">Author</h2>
      <p className="text-xs text-gray-500">Pick a newsroom profile. Their photo and role appear on the article byline.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {staff.map(person => {
          const active = selectedSlug === person.slug;
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onChange({
                author: person.displayName,
                authorSlug: person.slug,
                authorPhotoUrl: person.photoURL || '',
                authorTitle: person.title || '',
              })}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-stone-200 dark:border-white/10 hover:border-brand-400'
              }`}
            >
              {person.photoURL ? (
                <img src={person.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 flex items-center justify-center font-semibold">
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
      {!staff.length && !error && (
        <p className="text-sm text-gray-500">No staff profiles yet. Add reporters in Admin → Staff.</p>
      )}
    </div>
  );
}
