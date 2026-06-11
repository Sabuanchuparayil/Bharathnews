'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, PenLine, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getMyCreatorPosts, getCreatorProfileByUserId } from '../services/creator';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  published: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
};

const CreatorSpace = () => {
  const { user, loading, isCreator, loginWithGoogle } = useAuth();
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user && isCreator) {
      Promise.all([
        getMyCreatorPosts(user.uid),
        getCreatorProfileByUserId(user.uid),
      ]).then(([myPosts, myProfile]) => {
        setPosts(myPosts);
        setProfile(myProfile);
      }).catch(() => {});
    }
  }, [user, isCreator]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <button onClick={loginWithGoogle} className="btn-primary px-6 py-2.5 rounded-xl">Sign in</button>
      </Layout>
    );
  }

  if (!isCreator) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <PenLine className="w-12 h-12 text-brand-600 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl mb-4">Creator Space</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Apply to access your creator dashboard.</p>
        <Link href="/creator/apply" className="btn-primary px-6 py-2.5 rounded-xl">Apply Now</Link>
      </Layout>
    );
  }

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    pending: posts.filter(p => p.status === 'pending').length,
    views: posts.reduce((s, p) => s + (p.views || 0), 0),
  };

  return (
    <Layout mainClassName="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Creator Space</h1>
          {profile && (
            <p className="text-gray-500 mt-1">
              <Link href={`/@${profile.slug}`} className="text-brand-600 hover:underline">{'@' + profile.slug}</Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <ShareButton
              title={`${profile.displayName} on Bharath News`}
              text={profile.bio || `Creator profile @${profile.slug}`}
              path={`/@${profile.slug}`}
              contentType="creator_profile"
              showLabel
            />
          )}
          <Link href="/creator/new" className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl">
            <Plus className="w-4 h-4" /> New Content
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: stats.total, icon: PenLine },
          { label: 'Published', value: stats.published, icon: CheckCircle },
          { label: 'Pending', value: stats.pending, icon: Clock },
          { label: 'Total Views', value: stats.views, icon: BarChart3 },
        ].map(s => (
          <div key={s.label} className="glass-card-solid rounded-2xl p-4 text-center">
            <s.icon className="w-5 h-5 text-brand-600 mx-auto mb-2" />
            <p className="font-display font-bold text-2xl">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display font-bold text-xl mb-4">Your Content</h2>
      <div className="space-y-3">
        {posts.length === 0 && <p className="text-gray-500">No content yet. Create your first piece!</p>}
        {posts.map(post => (
          <Link
            key={post.id}
            href={`/creator/post/${post.id}`}
            className="glass-card-solid rounded-xl p-4 flex items-center justify-between card-lift block"
          >
            <div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[post.status]}`}>
                {post.status}
              </span>
              <h3 className="font-medium text-gray-900 dark:text-white mt-1">{post.title}</h3>
              <p className="text-xs text-gray-500">{post.type} · {post.category}</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>{post.views || 0} views</p>
              {post.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500 ml-auto mt-1" />}
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default CreatorSpace;
