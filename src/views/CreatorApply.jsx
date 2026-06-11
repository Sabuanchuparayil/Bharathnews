'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { PenLine, Video, CheckCircle, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { CREATOR_ROLES } from '../config/feeds.config';
import { submitRoleApplication, getUserApplication } from '../services/creator';

const CreatorApply = () => {
  const { user, userProfile, loading, loginWithGoogle, isCreator } = useAuth();
  const [requestedRole, setRequestedRole] = useState('contributor');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [sampleWork, setSampleWork] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState(null);

  useEffect(() => {
    if (user) {
      getUserApplication(user.uid).then(setExistingApp).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await submitRoleApplication(user.uid, { requestedRole, bio, portfolioUrl, sampleWork });
      toast.success('Application submitted! We will review it shortly.');
      const app = await getUserApplication(user.uid);
      setExistingApp(app);
    } catch (err) {
      if (err.message === 'PENDING_APPLICATION_EXISTS') {
        toast.info('You already have a pending application.');
      } else {
        toast.error('Failed to submit application.');
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isCreator) {
    return (
      <Layout mainClassName="max-w-2xl mx-auto px-4 py-12">
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">You&apos;re a Creator!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your role: <strong>{userProfile?.role}</strong>. Start sharing your voice with the community.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/creator/new" className="btn-primary px-6 py-2.5 rounded-xl">Create Content</Link>
            <Link href="/creator/space" className="btn-secondary px-6 py-2.5 rounded-xl">Creator Space</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Join as a Creator</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Share your stories, poems, videos, and perspectives with the India-GCC community.
      </p>

      {!user ? (
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Sign in to apply for the creator program.</p>
          <button onClick={loginWithGoogle} className="btn-primary px-6 py-2.5 rounded-xl">Sign in with Google</button>
        </div>
      ) : existingApp?.status === 'pending' ? (
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Application Under Review</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You applied as <strong>{existingApp.requestedRole}</strong>. We&apos;ll notify you once reviewed.
          </p>
        </div>
      ) : existingApp?.status === 'rejected' ? (
        <div className="glass-card-solid rounded-2xl p-8 mb-6">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Previous application rejected: {existingApp.feedback || 'No feedback provided.'}
          </p>
          <p className="text-sm text-gray-500">You may re-apply below.</p>
        </div>
      ) : null}

      {user && existingApp?.status !== 'pending' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREATOR_ROLES.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => setRequestedRole(role.id)}
                className={`glass-card-solid rounded-2xl p-5 text-left transition-all ${
                  requestedRole === role.id ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                {role.id === 'contributor' ? <PenLine className="w-6 h-6 text-brand-600 mb-2" /> : <Video className="w-6 h-6 text-brand-600 mb-2" />}
                <h3 className="font-display font-bold text-base">{role.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description}</p>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              required
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
              placeholder="Tell us about yourself and your experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Portfolio / Social Link</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Sample Work</label>
            <textarea
              value={sampleWork}
              onChange={e => setSampleWork(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
              placeholder="Paste a sample article, story, or video description..."
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}
    </Layout>
  );
};

export default CreatorApply;
