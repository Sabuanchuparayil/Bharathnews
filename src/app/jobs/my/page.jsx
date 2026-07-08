'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { getMyJobs } from '@/services/marketplace';
import { countryLabel } from '@/lib/marketplace-constants';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

export default function MyJobsPage() {
  const { user, isEmployer, loading } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isEmployer) {
      getMyJobs().then(r => setJobs(r.jobs || [])).catch(() => {}).finally(() => setFetching(false));
    } else {
      setFetching(false);
    }
  }, [isEmployer]);

  if (loading || fetching) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  if (!user || !isEmployer) {
    return <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center"><p>Employer access required.</p><Link href="/employer/apply" className="text-brand-600 underline">Register here</Link></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl">My Job Postings</h1>
          <Link href="/jobs/post" className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> New Job</Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No job postings yet.</p>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id} className="glass-card-solid rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.company_name} — {countryLabel(job.country)} | {job.job_type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[job.status] || ''}`}>{job.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
