'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Send, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { getSupabaseBrowser } from '@/lib/supabase-client';

const STATUS_TABS = [
  { id: 'failed', label: 'Failed' },
  { id: 'pending', label: 'Pending' },
  { id: 'sent', label: 'Sent' },
  { id: 'all', label: 'All' },
];

async function getAdminToken() {
  const supabase = getSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

const AdminDistribution = () => {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState('failed');
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getAdminToken();
    const [jobsRes, statusRes] = await Promise.all([
      fetch(`/api/admin/distribution-jobs?status=${tab}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch('/api/admin/worker?action=pipeline-status', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
    ]);
    const jobsData = await jobsRes.json();
    if (jobsRes.ok) {
      setJobs(jobsData.jobs || []);
      setCounts(jobsData.counts || null);
    }
    if (statusRes?.ok) {
      setPipeline(await statusRes.json());
    }
  }, [tab]);

  useEffect(() => {
    if (isAdmin) load().catch(() => {});
  }, [isAdmin, load]);

  const retryJob = async (jobId) => {
    setBusy(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/distribution-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry failed');
      toast.success('Job queued for retry');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runBackfill = async () => {
    setBusy(true);
    try {
      const token = await getAdminToken();
      const res = await fetch('/api/admin/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'backfill', limit: 40 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backfill failed');
      toast.success(`Backfill: ${data.enqueued ?? 0} jobs from ${data.scanned ?? 0} articles`);
      const distribute = await fetch('/api/admin/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'distribute', backfill: false, telegram: 3, facebook: 2 }),
      });
      const distributeData = await distribute.json().catch(() => ({}));
      if (!distribute.ok) throw new Error(distributeData.error || 'Distribution run failed');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const social = pipeline?.social || {};

  return (
    <AdminLayout
      title="Distribution Queue"
      description="Telegram & Facebook jobs with automatic retries"
      actions={
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={busy} className="btn-secondary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" onClick={runBackfill} disabled={busy} className="btn-primary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
              <Send className="w-4 h-4" /> Backfill & Process
            </button>
          </div>
      }
    >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            ['Pending', counts?.pending ?? social.distributionJobs?.pending ?? '—', 'text-amber-600', Clock],
            ['Failed', counts?.failed ?? social.distributionJobs?.failed ?? '—', 'text-red-600', AlertTriangle],
            ['Sent', counts?.sent ?? social.distributionJobs?.sent ?? '—', 'text-green-600', CheckCircle],
            ['Tier', pipeline?.tier || 'free', 'text-brand-600', RefreshCw],
          ].map(([label, val, color, Icon]) => (
            <div key={label} className="glass-card-solid rounded-xl p-4">
              <Icon className={`w-5 h-5 mb-2 ${color}`} />
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t.id ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="glass-card-solid rounded-2xl overflow-hidden">
          {jobs.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No {tab === 'all' ? '' : tab} jobs.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {jobs.map(job => (
                <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{job.articles?.title || job.article_id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {job.channel} · {job.status} · attempts {job.attempts}/{job.max_attempts}
                      {job.articles?.language ? ` · ${job.articles.language}` : ''}
                    </p>
                    {job.last_error && (
                      <p className="text-xs text-red-600 mt-1 truncate">{job.last_error}</p>
                    )}
                  </div>
                  {(job.status === 'failed' || job.status === 'pending') && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => retryJob(job.id)}
                      className="btn-secondary text-xs px-3 py-1.5 rounded-lg shrink-0"
                    >
                      Retry now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default AdminDistribution;
