'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Building2, CheckCircle, Clock, Upload, X } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { submitEmployerApplication, getMyEmployerApplication, getKycUploadUrl } from '../services/marketplace';
import { GCC_COUNTRIES, KYC_DOC_TYPES } from '../lib/marketplace-constants';

const EmployerApply = () => {
  const { user, loading, loginWithGoogle, isEmployer } = useAuth();
  const [existingApp, setExistingApp] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  const [form, setForm] = useState({
    companyName: '',
    tradeLicenseNo: '',
    country: 'uae',
    city: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    whatsapp: '',
    companyWebsite: '',
    companyDescription: '',
  });
  const [docs, setDocs] = useState({});
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (user) {
      getMyEmployerApplication()
        .then(r => setExistingApp(r.application))
        .catch(() => {});
    }
  }, [user]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDocUpload = async (docType, file) => {
    if (!file) return;
    setUploadingDoc(docType);
    try {
      const { uploadUrl, path } = await getKycUploadUrl(file.name, file.type);
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setDocs(prev => ({ ...prev, [docType]: { path, name: file.name } }));
      toast.success(`${file.name} uploaded.`);
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    }
    setUploadingDoc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please accept the terms.'); return; }

    const requiredDocs = KYC_DOC_TYPES.filter(d => d.required);
    for (const doc of requiredDocs) {
      if (!docs[doc.id]) { toast.error(`Please upload: ${doc.label}`); return; }
    }

    setSubmitting(true);
    try {
      const documentUrls = {};
      Object.entries(docs).forEach(([key, val]) => { documentUrls[key] = val.path; });
      await submitEmployerApplication({ ...form, documentUrls });
      toast.success('Application submitted! We will review your KYC documents.');
      const r = await getMyEmployerApplication();
      setExistingApp(r.application);
    } catch (err) {
      toast.error(err.message || 'Submission failed.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Layout><div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div></Layout>
    );
  }

  if (isEmployer) {
    return (
      <Layout mainClassName="max-w-2xl mx-auto px-4 py-12">
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">Verified Employer</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Your KYC is approved. You can now post jobs.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/jobs/post" className="btn-primary px-6 py-2.5 rounded-xl">Post a Job</Link>
            <Link href="/employer/dashboard" className="btn-secondary px-6 py-2.5 rounded-xl">Employer Dashboard</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Employer Registration</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Register as an employer to post jobs for Indian professionals in GCC. KYC verification is required.
      </p>

      {!user ? (
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Sign in to apply as an employer.</p>
          <button onClick={() => loginWithGoogle('/employer/apply')} className="btn-primary px-6 py-2.5 rounded-xl">Sign in with Google</button>
        </div>
      ) : existingApp?.status === 'pending' ? (
        <div className="glass-card-solid rounded-2xl p-8 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Application Under Review</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your KYC documents are being verified. We&apos;ll notify you once approved.
          </p>
        </div>
      ) : existingApp?.status === 'rejected' ? (
        <div className="glass-card-solid rounded-2xl p-8 mb-6">
          <p className="text-red-600 dark:text-red-400 mb-2 font-medium">Application Rejected</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{existingApp.admin_feedback || 'No feedback provided.'}</p>
          <p className="text-sm text-gray-500">You may re-apply below with updated documents.</p>
        </div>
      ) : existingApp?.status === 'resubmit' ? (
        <div className="glass-card-solid rounded-2xl p-8 mb-6">
          <p className="text-amber-600 dark:text-amber-400 mb-2 font-medium">Resubmission Requested</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{existingApp.admin_feedback || 'Please update your documents.'}</p>
        </div>
      ) : null}

      {user && existingApp?.status !== 'pending' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card-solid rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-600" /> Company Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trade License No.</label>
                <input name="tradeLicenseNo" value={form.tradeLicenseNo} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country *</label>
                <select name="country" value={form.country} onChange={handleChange} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                  {GCC_COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input name="city" value={form.city} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Company Website</label>
                <input name="companyWebsite" value={form.companyWebsite} onChange={handleChange} type="url" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="https://" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Company Description</label>
                <textarea name="companyDescription" value={form.companyDescription} onChange={handleChange} rows={3} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
              </div>
            </div>
          </div>

          <div className="glass-card-solid rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-4">Contact Person</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input name="contactName" value={form.contactName} onChange={handleChange} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input name="contactEmail" value={form.contactEmail} onChange={handleChange} required type="email" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input name="contactPhone" value={form.contactPhone} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="+971..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="+971..." />
              </div>
            </div>
          </div>

          <div className="glass-card-solid rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-600" /> KYC Documents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload clear scans or photos (JPEG, PNG, PDF, max 10MB each).</p>
            <div className="space-y-4">
              {KYC_DOC_TYPES.map(doc => (
                <div key={doc.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.label} {doc.required && <span className="text-red-500">*</span>}</p>
                    {docs[doc.id] ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600">{docs[doc.id].name}</span>
                        <button type="button" onClick={() => setDocs(prev => { const n = { ...prev }; delete n[doc.id]; return n; })} className="text-red-500"><X className="w-3 h-3" /></button>
                      </div>
                    ) : null}
                  </div>
                  <label className="btn-secondary px-4 py-2 rounded-lg text-xs cursor-pointer">
                    {uploadingDoc === doc.id ? 'Uploading...' : 'Choose File'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={uploadingDoc === doc.id}
                      onChange={e => handleDocUpload(doc.id, e.target.files?.[0])}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I confirm that the information and documents provided are accurate. I agree to the <Link href="/terms" className="text-brand-600 underline">Terms of Service</Link>.
            </span>
          </label>

          <button type="submit" disabled={submitting} className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50 w-full sm:w-auto">
            {submitting ? 'Submitting...' : 'Submit KYC Application'}
          </button>
        </form>
      )}
    </Layout>
  );
};

export default EmployerApply;
