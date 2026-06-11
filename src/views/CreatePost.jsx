'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import ContentEditor from '../components/ContentEditor';
import { useAuth } from '../context/AuthContext';
import { createCreatorPost } from '../services/creator';

const CreatePost = () => {
  const { user, loading, loginWithGoogle, isCreator, isVlogger } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'article',
    title: '',
    body: '',
    videoUrl: '',
    category: 'opinion',
    coverImage: '',
    tags: '',
    visibility: 'public',
  });

  const onChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e, asDraft = false) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const docRef = await createCreatorPost(user.uid, {
        type: form.type,
        title: form.title,
        body: form.body,
        videoUrl: form.videoUrl,
        category: form.category,
        coverImage: form.coverImage,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        visibility: form.visibility,
        status: asDraft ? 'draft' : 'pending',
      });
      toast.success(asDraft ? 'Draft saved!' : 'Submitted for moderation!');
      if (!asDraft) {
        setForm({ type: 'article', title: '', body: '', videoUrl: '', category: 'opinion', coverImage: '', tags: '', visibility: 'public' });
      }
    } catch (err) {
      if (err.message === 'CREATOR_PROFILE_REQUIRED') {
        toast.error('Complete your creator profile first.');
      } else {
        toast.error('Failed to submit content.');
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

  if (!user) {
    return (
      <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="mb-4">Sign in to create content.</p>
        <button onClick={loginWithGoogle} className="btn-primary px-6 py-2.5 rounded-xl">Sign in</button>
      </Layout>
    );
  }

  if (!isCreator) {
    return (
      <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display font-bold text-2xl mb-4">Creator Access Required</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Apply to become a citizen journalist or vlogger first.</p>
        <Link href="/creator/apply" className="btn-primary px-6 py-2.5 rounded-xl">Apply Now</Link>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Create Content</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Share articles, stories, poems, journals, or videos. All submissions are reviewed before publishing.
      </p>

      <form onSubmit={e => handleSubmit(e, false)} className="glass-card-solid rounded-2xl p-6 sm:p-8 space-y-6">
        <ContentEditor form={form} onChange={onChange} isVlogger={isVlogger} />

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5 rounded-xl disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
          <button type="button" onClick={e => handleSubmit(e, true)} disabled={submitting} className="btn-secondary px-6 py-2.5 rounded-xl disabled:opacity-50">
            Save Draft
          </button>
          <Link href="/creator/space" className="px-6 py-2.5 text-sm text-gray-500 hover:text-brand-600">My Creator Space</Link>
        </div>
      </form>
    </Layout>
  );
};

export default CreatePost;
