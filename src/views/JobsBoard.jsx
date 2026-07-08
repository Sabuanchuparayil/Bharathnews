'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Building2, Clock, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getApprovedJobs } from '../services/marketplace';
import { GCC_COUNTRIES, JOB_TYPES, countryLabel } from '../lib/marketplace-constants';

const JobCard = ({ job }) => (
  <Link href={`/jobs/${job.slug}`} className="glass-card-solid rounded-2xl p-5 hover:shadow-lg transition-shadow block">
    <div className="flex items-start gap-3">
      {job.company_logo_url ? (
        <img src={job.company_logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-brand-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 dark:text-white truncate">{job.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{job.company_name}</p>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{countryLabel(job.country)}{job.city ? `, ${job.city}` : ''}</span>
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.job_type}</span>
          {job.salary_min && <span>{job.salary_currency} {job.salary_min}{job.salary_max ? `–${job.salary_max}` : '+'}</span>}
        </div>
      </div>
    </div>
  </Link>
);

const JobsBoard = () => {
  const { isEmployer } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [jobType, setJobType] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (country) params.country = country;
      if (jobType) params.job_type = jobType;
      const res = await getApprovedJobs(params);
      setJobs(res.jobs || []);
    } catch { setJobs([]); }
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [country, jobType]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">GCC Jobs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Job opportunities for Indian professionals in the Gulf</p>
          </div>
          {isEmployer && (
            <Link href="/jobs/post" className="btn-primary px-5 py-2.5 rounded-xl text-sm whitespace-nowrap">Post a Job</Link>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select value={country} onChange={e => setCountry(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-2 text-sm">
            <option value="">All Countries</option>
            {GCC_COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={jobType} onChange={e => setJobType(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-2 text-sm">
            <option value="">All Types</option>
            {JOB_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No jobs posted yet.</p>
            {!isEmployer && <p className="text-sm text-gray-400 mt-2">Are you an employer? <Link href="/employer/apply" className="text-brand-600 underline">Register here</Link> to post jobs.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default JobsBoard;
