'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, X, Users, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getPendingApplications, reviewRoleApplication,
  getPendingCreatorPosts, moderateCreatorPost,
} from '../services/creator';
import { getDbAsync, firestoreOps } from '@/lib/firebase-client';

const AdminModeration = () => {
  const { user, loading, isAdmin, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState('posts');
  const [applications, setApplications] = useState([]);
  const [posts, setPosts] = useState([]);
  const [feedback, setFeedback] = useState({});

  const load = async () => {
    const [apps, pendingPosts] = await Promise.all([
      getPendingApplications(),
      getPendingCreatorPosts(),
    ]);
    setApplications(apps);
    setPosts(pendingPosts);
  };

  useEffect(() => {
    if (isAdmin) load().catch(() => {});
  }, [isAdmin]);

  const handleAppReview = async (app, approved) => {
    try {
      const db = await getDbAsync();
      if (!db) throw new Error('Firebase unavailable');
      const { doc, getDoc } = await firestoreOps();
      const userSnap = await getDoc(doc(db, 'users', app.userId));
      const userData = userSnap.data() || {};
      await reviewRoleApplication(app.id, {
        approved,
        feedback: feedback[`app-${app.id}`] || '',
        userId: app.userId,
        requestedRole: app.requestedRole,
        displayName: userData.displayName || 'Creator',
        photoURL: userData.photoURL || '',
      });
      toast.success(approved ? 'Application approved' : 'Application rejected');
      load();
    } catch {
      toast.error('Failed to review application');
    }
  };

  const handlePostReview = async (post, approved) => {
    try {
      await moderateCreatorPost(post.id, {
        approved,
        feedback: feedback[`post-${post.id}`] || '',
      });
      toast.success(approved ? 'Post published' : 'Post rejected');
      load();
    } catch {
      toast.error('Failed to moderate post');
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showBottomNav={false} mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <button onClick={loginWithGoogle} className="btn-primary px-6 py-2.5 rounded-xl">Sign in</button>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout showBottomNav={false} mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Access denied. Admin only.</p>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} mainClassName="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-display font-bold text-3xl mb-6">Moderation Queue</h1>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${tab === 'posts' ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2'}`}
        >
          <FileText className="w-4 h-4" /> Posts ({posts.length})
        </button>
        <button
          onClick={() => setTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${tab === 'applications' ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2'}`}
        >
          <Users className="w-4 h-4" /> Applications ({applications.length})
        </button>
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 && <p className="text-gray-500">No pending posts.</p>}
          {posts.map(post => (
            <div key={post.id} className="glass-card-solid rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase text-brand-600">{post.type}</span>
                  <h3 className="font-display font-bold text-lg mt-1">{post.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">by {'@' + post.authorSlug} · {post.category}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-3">{post.body}</p>
                </div>
              </div>
              <textarea
                value={feedback[`post-${post.id}`] || ''}
                onChange={e => setFeedback(prev => ({ ...prev, [`post-${post.id}`]: e.target.value }))}
                placeholder="Optional feedback..."
                rows={2}
                className="w-full mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => handlePostReview(post, true)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handlePostReview(post, false)} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 && <p className="text-gray-500">No pending applications.</p>}
          {applications.map(app => (
            <div key={app.id} className="glass-card-solid rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg">Role: {app.requestedRole}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{app.bio}</p>
              {app.portfolioUrl && <p className="text-sm text-brand-600 mt-1">{app.portfolioUrl}</p>}
              {app.sampleWork && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{app.sampleWork}</p>}
              <textarea
                value={feedback[`app-${app.id}`] || ''}
                onChange={e => setFeedback(prev => ({ ...prev, [`app-${app.id}`]: e.target.value }))}
                placeholder="Optional feedback..."
                rows={2}
                className="w-full mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleAppReview(app, true)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handleAppReview(app, false)} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default AdminModeration;
