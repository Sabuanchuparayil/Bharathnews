'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import DeskGate from '../components/DeskGate';
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
    <DeskGate>
      <Layout showBottomNav={false} mainClassName="max-w-5xl mx-auto px-4 py-10">
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Newsroom</p>
        <h1 className="font-display font-bold text-3xl text-stone-900 dark:text-white mt-1">Editorial desk</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
          Paste Claude co-work copy in English or Malayalam, choose a cover, name the author, and send it through review before it is published.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/desk/compose" className="btn-primary px-5 py-2.5 rounded-xl">Compose</Link>
          <Link href="/desk/review" className="btn-secondary px-5 py-2.5 rounded-xl">Review queue</Link>
          <Link href="/editorial" className="px-5 py-2.5 text-sm text-brand-700 dark:text-brand-300">Editorial policy</Link>
        </div>
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
        {stats && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3">
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
      </Layout>
    </DeskGate>
  );
};

export default DeskHome;
