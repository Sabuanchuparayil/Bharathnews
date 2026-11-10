'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, X, Users, FileText } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import {
  getPendingApplications, reviewRoleApplication,
  getPendingCreatorPosts, moderateCreatorPost,
} from '../services/creator';
import { getCategoryLabel } from '../utils/categoryColors';

const AdminModeration = () => {
  const { isAdmin } = useAuth();
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
    if (isAdmin) load().catch(err => toast.error(err.message || 'Could not load the queue'));
  }, [isAdmin]);

  const handleAppReview = async (app, approved) => {
    try {
      await reviewRoleApplication(app.id, {
        approved,
        feedback: feedback[`app-${app.id}`] || '',
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

  return (
    <AdminLayout title="Moderation Queue" description={`${posts.length} posts · ${applications.length} applications pending`}>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'posts' ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2 hover:bg-surface-3'}`}
        >
          <FileText className="w-4 h-4" /> Posts ({posts.length})
        </button>
        <button
          onClick={() => setTab('applications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'applications' ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2 hover:bg-surface-3'}`}
        >
          <Users className="w-4 h-4" /> Applications ({applications.length})
        </button>
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 && <p className="text-gray-500 py-8 text-center">No pending posts.</p>}
          {posts.map(post => (
            <div key={post.id} className="glass-card-solid rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase text-brand-600">{post.type}</span>
                  <h3 className="font-display font-bold text-lg mt-1">{post.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">by {'@' + post.authorSlug} · {getCategoryLabel(post.category)}</p>
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
                <button onClick={() => handlePostReview(post, true)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handlePostReview(post, false)} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 && <p className="text-gray-500 py-8 text-center">No pending applications.</p>}
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
                <button onClick={() => handleAppReview(app, true)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 transition-colors">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handleAppReview(app, false)} className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-colors">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminModeration;
