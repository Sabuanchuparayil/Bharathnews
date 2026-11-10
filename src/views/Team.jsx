'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

const Team = () => {
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/staff')
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not load the team.');
        setStaff(data.staff || []);
      })
      .catch(err => setError(err.message || 'Could not load the team.'));
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">The Bharath News</p>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-stone-900 dark:text-white mt-1">Editorial team</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
          Reporters and editors behind Bharath News coverage for the India–GCC diaspora.
        </p>
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(person => (
            <Link
              key={person.id}
              href={`/authors/${person.slug}`}
              className="rounded-2xl border border-stone-200 dark:border-white/10 p-5 hover:border-brand-400 transition-colors"
            >
              {person.photoURL ? (
                <img src={person.photoURL} alt="" className="w-20 h-20 rounded-full object-cover mb-4" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 flex items-center justify-center text-2xl font-semibold mb-4">
                  {(person.displayName || '?').slice(0, 1)}
                </div>
              )}
              <h2 className="font-display font-bold text-xl text-stone-900 dark:text-white">{person.displayName}</h2>
              <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">{person.title || 'Reporter'}</p>
              {person.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">{person.bio}</p>}
            </Link>
          ))}
        </div>
        {!error && !staff.length && (
          <p className="mt-8 text-sm text-gray-500">Editorial profiles will appear here once they are published.</p>
        )}
      </div>
    </Layout>
  );
};

export default Team;
