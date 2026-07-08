'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Check, X, Building2, Briefcase, ShoppingBag, ExternalLink } from 'lucide-react';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';
import {
  getAdminEmployerApplications, reviewEmployerApplication,
  getAdminPendingJobs, moderateJob,
  getAdminPendingClassifieds, moderateClassified,
} from '../services/marketplace';
import { countryLabel } from '../lib/marketplace-constants';

const AdminMarketplace = () => {
  const { user, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState('kyc');
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [classifieds, setClassifieds] = useState([]);
  const [feedback, setFeedback] = useState({});

  const load = async () => {
    const [apps, j, c] = await Promise.all([
      getAdminEmployerApplications().catch(() => ({ applications: [] })),
      getAdminPendingJobs().catch(() => ({ jobs: [] })),
      getAdminPendingClassifieds().catch(() => ({ classifieds: [] })),
    ]);
    setApplications(apps.applications || []);
    setJobs(j.jobs || []);
    setClassifieds(c.classifieds || []);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const handleKycAction = async (app, action) => {
    try {
      await reviewEmployerApplication(app.id, { action, feedback: feedback[`kyc-${app.id}`] || '' });
      toast.success(action === 'approve' ? 'Employer approved' : action === 'reject' ? 'Application rejected' : 'Resubmission requested');
      load();
    } catch { toast.error('Failed to process KYC.'); }
  };

  const handleJobAction = async (job, action) => {
    try {
      await moderateJob(job.id, { action, feedback: feedback[`job-${job.id}`] || '' });
      toast.success(action === 'approve' ? 'Job published' : 'Job rejected');
      load();
    } catch { toast.error('Failed to moderate job.'); }
  };

  const handleClassifiedAction = async (item, action) => {
    try {
      await moderateClassified(item.id, { action, feedback: feedback[`cls-${item.id}`] || '' });
      toast.success(action === 'approve' ? 'Listing published' : 'Listing rejected');
      load();
    } catch { toast.error('Failed to moderate listing.'); }
  };

  if (loading) {
    return <Layout showBottomNav={false}><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  }

  if (!user || !isAdmin) {
    return <Layout showBottomNav={false}><div className="flex items-center justify-center min-h-[60vh] px-4"><LoginPrompt title={!user ? 'Sign In Required' : 'Access Denied'} description="Admin role required." nextPath="/admin/marketplace" showAdminHint /></div></Layout>;
  }

  const tabs = [
    { id: 'kyc', label: 'Employer KYC', icon: Building2, count: applications.length },
    { id: 'jobs', label: 'Job Postings', icon: Briefcase, count: jobs.length },
    { id: 'classifieds', label: 'Classifieds', icon: ShoppingBag, count: classifieds.length },
  ];

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Marketplace Moderation</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-dark-surface-1 text-gray-700 dark:text-gray-300'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.count > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'kyc' && (
          <div className="space-y-4">
            {applications.length === 0 ? <p className="text-gray-500 text-center py-12">No pending KYC applications.</p> : applications.map(app => (
              <div key={app.id} className="glass-card-solid rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{app.company_name}</h3>
                    <p className="text-sm text-gray-500">{app.contact_name} — {countryLabel(app.country)}{app.city ? `, ${app.city}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-1">License: {app.trade_license_no || 'N/A'} | Email: {app.contact_email}</p>
                    {app.company_website && <a href={app.company_website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" />{app.company_website}</a>}
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">{app.status}</span>
                </div>
                {app.document_urls && Object.keys(app.document_urls).length > 0 && (
                  <div className="mb-3"><p className="text-xs font-medium mb-1">Documents:</p>
                    <div className="flex gap-2 flex-wrap">{Object.entries(app.document_urls).map(([k, v]) => <span key={k} className="text-xs bg-gray-100 dark:bg-dark-surface-2 px-2 py-1 rounded">{k}: uploaded</span>)}</div>
                  </div>
                )}
                <input value={feedback[`kyc-${app.id}`] || ''} onChange={e => setFeedback(p => ({ ...p, [`kyc-${app.id}`]: e.target.value }))} placeholder="Feedback (optional)" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => handleKycAction(app, 'approve')} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Approve</button>
                  <button onClick={() => handleKycAction(app, 'resubmit')} className="btn-secondary px-4 py-2 rounded-lg text-sm">Request Resubmit</button>
                  <button onClick={() => handleKycAction(app, 'reject')} className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"><X className="w-4 h-4" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'jobs' && (
          <div className="space-y-4">
            {jobs.length === 0 ? <p className="text-gray-500 text-center py-12">No pending job postings.</p> : jobs.map(job => (
              <div key={job.id} className="glass-card-solid rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company_name} — {countryLabel(job.country)}{job.city ? `, ${job.city}` : ''} | {job.job_type}</p>
                  </div>
                  {job.salary_min && <span className="text-xs text-gray-500">{job.salary_currency} {job.salary_min}{job.salary_max ? `–${job.salary_max}` : '+'}</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{job.description}</p>
                <input value={feedback[`job-${job.id}`] || ''} onChange={e => setFeedback(p => ({ ...p, [`job-${job.id}`]: e.target.value }))} placeholder="Feedback (optional)" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => handleJobAction(job, 'approve')} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Publish</button>
                  <button onClick={() => handleJobAction(job, 'reject')} className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"><X className="w-4 h-4" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'classifieds' && (
          <div className="space-y-4">
            {classifieds.length === 0 ? <p className="text-gray-500 text-center py-12">No pending classifieds.</p> : classifieds.map(item => (
              <div key={item.id} className="glass-card-solid rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.listing_type} — {item.category} | {countryLabel(item.country)}{item.city ? `, ${item.city}` : ''}</p>
                  </div>
                  {item.price && <span className="text-sm font-medium">{item.price_currency} {item.price}</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{item.description}</p>
                <input value={feedback[`cls-${item.id}`] || ''} onChange={e => setFeedback(p => ({ ...p, [`cls-${item.id}`]: e.target.value }))} placeholder="Feedback (optional)" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => handleClassifiedAction(item, 'approve')} className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Publish</button>
                  <button onClick={() => handleClassifiedAction(item, 'reject')} className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"><X className="w-4 h-4" /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminMarketplace;
