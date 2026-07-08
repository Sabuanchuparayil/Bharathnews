'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { createJob } from '../services/marketplace';
import { GCC_COUNTRIES, JOB_TYPES, GENDER_PREFERENCES, countryCurrency } from '../lib/marketplace-constants';

const PostJob = () => {
  const { user, isEmployer, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', jobType: 'full-time',
    industry: '', genderPreference: 'any', country: 'uae', city: '',
    remoteOk: false, salaryMin: '', salaryMax: '', salaryCurrency: 'AED',
    benefits: '', applyUrl: '', applyEmail: '', whatsappNumber: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'country') updated.salaryCurrency = countryCurrency(value);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applyUrl.trim() && !form.applyEmail.trim() && !form.whatsappNumber.trim()) {
      toast.error('Provide at least one apply method (URL, email, or WhatsApp).');
      return;
    }
    setSubmitting(true);
    try {
      await createJob({
        ...form,
        salaryMin: form.salaryMin ? (parseInt(form.salaryMin, 10) || null) : null,
        salaryMax: form.salaryMax ? (parseInt(form.salaryMax, 10) || null) : null,
      });
      toast.success('Job submitted for review! It will be published after approval.');
      router.push('/jobs/my');
    } catch (err) {
      toast.error(err.message || 'Failed to post job.');
    }
    setSubmitting(false);
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  if (!user || !isEmployer) {
    return (
      <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display font-bold text-2xl mb-4">Employer Access Required</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Complete KYC verification to post jobs.</p>
        <a href="/employer/apply" className="btn-primary px-6 py-2.5 rounded-xl">Register as Employer</a>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Post a Job</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card-solid rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="e.g. Senior Software Engineer" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={5} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="Job responsibilities, company culture..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requirements</label>
            <textarea name="requirements" value={form.requirements} onChange={handleChange} rows={3} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="Qualifications, experience, skills..." />
          </div>
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Classification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Type</label>
              <select name="jobType" value={form.jobType} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {JOB_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <input name="industry" value={form.industry} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="IT, Construction..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender Preference</label>
              <select name="genderPreference" value={form.genderPreference} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {GENDER_PREFERENCES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Location & Salary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Country *</label>
              <select name="country" value={form.country} onChange={handleChange} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {GCC_COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input name="city" value={form.city} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="Dubai, Riyadh..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Salary Min</label>
              <input name="salaryMin" value={form.salaryMin} onChange={handleChange} type="number" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Salary Max</label>
              <input name="salaryMax" value={form.salaryMax} onChange={handleChange} type="number" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" name="remoteOk" checked={form.remoteOk} onChange={handleChange} id="remoteOk" />
              <label htmlFor="remoteOk" className="text-sm">Remote work possible</label>
            </div>
          </div>
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">How to Apply</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Application URL</label>
              <input name="applyUrl" value={form.applyUrl} onChange={handleChange} type="url" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="https://careers.company.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Application Email</label>
              <input name="applyEmail" value={form.applyEmail} onChange={handleChange} type="email" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
              <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="+971..." />
            </div>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50 w-full sm:w-auto">
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </Layout>
  );
};

export default PostJob;
