'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Briefcase, Building2, Calendar, ExternalLink, MessageCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { getJobBySlug } from '../services/marketplace';
import { countryLabel } from '../lib/marketplace-constants';
import { safeJsonLd } from '../lib/metadata';

const JobDetail = ({ slug }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJobBySlug(slug)
      .then(r => setJob(r.job))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  if (!job) return <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center"><p className="text-gray-500">Job not found or expired.</p></Layout>;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.published_at || job.created_at,
    validThrough: job.expires_at,
    employmentType: job.job_type?.toUpperCase().replace('-', '_'),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name,
      ...(job.company_logo_url ? { logo: job.company_logo_url } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.city || '',
        addressCountry: job.country?.toUpperCase(),
      },
    },
    ...(job.salary_min ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: job.salary_currency,
        value: { '@type': 'QuantitativeValue', minValue: job.salary_min, maxValue: job.salary_max || job.salary_min, unitText: 'MONTH' },
      },
    } : {}),
  };

  return (
    <Layout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/jobs" className="text-sm text-brand-600 mb-4 inline-block">&larr; Back to Jobs</Link>
        <div className="glass-card-solid rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-brand-600" />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">{job.title}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">{job.company_name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{countryLabel(job.country)}{job.city ? `, ${job.city}` : ''}</span>
            <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.job_type}</span>
            {job.salary_min && <span>{job.salary_currency} {job.salary_min}{job.salary_max ? `–${job.salary_max}` : '+'}/month</span>}
            {job.remote_ok && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Remote OK</span>}
            {job.industry && <span>{job.industry}</span>}
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
            <h2 className="text-lg font-bold mb-2">Description</h2>
            <p className="whitespace-pre-wrap">{job.description}</p>
            {job.requirements && (<><h2 className="text-lg font-bold mt-6 mb-2">Requirements</h2><p className="whitespace-pre-wrap">{job.requirements}</p></>)}
            {job.benefits && (<><h2 className="text-lg font-bold mt-6 mb-2">Benefits</h2><p className="whitespace-pre-wrap">{job.benefits}</p></>)}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {job.apply_url && <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Apply Now</a>}
            {job.whatsapp_number && <a href={`https://wa.me/${job.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-secondary px-6 py-2.5 rounded-xl flex items-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
            {job.apply_email && <a href={`mailto:${job.apply_email}`} className="btn-secondary px-6 py-2.5 rounded-xl">Email</a>}
          </div>

          <p className="text-xs text-gray-400 mt-6">
            <Calendar className="w-3 h-3 inline mr-1" />
            Posted {job.published_at ? new Date(job.published_at).toLocaleDateString() : 'recently'}
            {job.expires_at && ` — Expires ${new Date(job.expires_at).toLocaleDateString()}`}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default JobDetail;
