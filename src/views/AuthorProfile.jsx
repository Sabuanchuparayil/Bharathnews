'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import RelativeTime from '../components/RelativeTime';

const AuthorProfile = ({ slug }) => {
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/staff/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Author not found.');
        setProfile(data.profile);
        setArticles(data.articles || []);
      })
      .catch(err => setError(err.message || 'Author not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display font-bold text-2xl">Author not found</h1>
          <Link href="/team" className="inline-block mt-4 text-brand-700 dark:text-brand-300">Back to editorial team</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/team" className="text-sm text-brand-700 dark:text-brand-300">Editorial team</Link>
        <div className="mt-4 flex items-start gap-4">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 flex items-center justify-center text-3xl font-semibold">
              {(profile.displayName || '?').slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="font-display font-bold text-3xl text-stone-900 dark:text-white">{profile.displayName}</h1>
            <p className="text-brand-700 dark:text-brand-300 mt-1">{profile.title || 'Reporter'}</p>
            {profile.bio && <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl">{profile.bio}</p>}
          </div>
        </div>

        <h2 className="font-display font-bold text-xl mt-10 mb-4">Stories from {profile.displayName}</h2>
        <div className="space-y-3">
          {articles.map(article => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="block rounded-xl border border-stone-200 dark:border-white/10 px-4 py-3 hover:border-brand-400"
            >
              <p className="font-medium text-stone-900 dark:text-white">{article.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {article.category}
                {article.publishedAt && <> · <RelativeTime date={article.publishedAt} /></>}
              </p>
            </Link>
          ))}
          {!articles.length && (
            <p className="text-sm text-gray-500">No published stories under this byline yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuthorProfile;
