'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DeskLayout from '../components/DeskLayout';
import { deskFetch } from '@/lib/desk-client';

const DeskHome = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    deskFetch('/api/desk/articles?view=stats')
      .then(setStats)
      .catch(err => setError(err.message || 'Could not load the newsroom.'));
  }, []);

  return (
    <DeskLayout
      title="Editorial desk"
      description="Paste co-work copy in English or Malayalam, choose a cover, name the author, and send it through review before it is published."
      actions={(
        <>
          <Link href="/editorial" className="px-3 py-2 text-sm text-brand-700 dark:text-brand-300">Editorial policy</Link>
          <Link href="/desk/review" className="btn-secondary px-4 py-2 rounded-xl text-sm">Review queue</Link>
          <Link href="/desk/compose" className="btn-primary px-4 py-2 rounded-xl text-sm">Compose</Link>
        </>
      )}
    >
        {!stats && !error && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-stone-200 dark:border-white/10 p-4">
                <p className="text-sm text-gray-500">Waiting for review</p>
                <p className="font-display font-bold text-3xl">{stats.queue}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 dark:border-white/10 p-4">
                <p className="text-sm text-gray-500">Published this week</p>
                <p className="font-display font-bold text-3xl">{stats.publishedWeek}</p>
              </div>
            </div>
            <h2 className="font-display font-bold text-xl mt-8 mb-3">Recent desk copy</h2>
            <ul className="space-y-2">
              {(stats.recent || []).length === 0 && <li className="text-sm text-gray-500">No desk articles yet.</li>}
              {(stats.recent || []).map(item => (
                <li key={item.id} className="rounded-xl border border-stone-200 dark:border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs uppercase text-gray-500">{item.editorialStatus} · {item.language}</span>
                </li>
              ))}
            </ul>
          </>
        )}
    </DeskLayout>
  );
};

export default DeskHome;
