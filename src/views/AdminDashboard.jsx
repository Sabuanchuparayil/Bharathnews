'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp, Users, Rss, Send, AlertTriangle, ArrowUpRight,
  Newspaper, Clock, CheckCircle, XCircle, Copy,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminFetch, getAdminStats } from '../services/admin';

const CHART_COLORS = ['#0D7377', '#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#a855f7', '#06b6d4'];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

function StatCard({ icon: Icon, label, value, sublabel, trend, color = 'bg-brand-600', href, loading: isLoading }) {
  const card = (
    <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-dark-surface-1 border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 ${href ? 'hover:shadow-card-hover hover:border-brand-200 dark:hover:border-brand-700 cursor-pointer group' : 'shadow-card'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">{label}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight tabular-nums">{value}</p>
          )}
          {sublabel && !isLoading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sublabel}</p>
          )}
          {trend && !isLoading && (
            <span className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              <ArrowUpRight className={`w-3 h-3 ${trend.positive ? '' : 'rotate-90'}`} />
              {trend.label}
            </span>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {href && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
      )}
    </div>
  );
  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

function PipelineChip({ label, value, color, loading: isLoading }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-surface-1 dark:bg-dark-surface-2 min-w-[80px]">
      {isLoading ? (
        <Skeleton className="h-6 w-10 mb-1" />
      ) : (
        <p className={`text-xl font-bold tabular-nums ${color}`}>
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        </p>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = '', action }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-dark-surface-1 border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800/60">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          <h2 className="font-display font-bold text-sm text-gray-900 dark:text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-surface-2 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-gray-900 dark:text-white">{label || payload[0]?.name}</p>
      <p className="text-gray-500 tabular-nums">{payload[0]?.value?.toLocaleString('en-IN')} articles</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [statsReady, setStatsReady] = useState(false);
  const [pipelineReady, setPipelineReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then(data => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setStats(null); })
      .finally(() => { if (!cancelled) setStatsReady(true); });

    adminFetch('/api/admin/worker?action=pipeline-status')
      .then(data => { if (!cancelled) setPipeline(data); })
      .catch(() => { if (!cancelled) setPipeline(null); })
      .finally(() => { if (!cancelled) setPipelineReady(true); });

    return () => { cancelled = true; };
  }, []);

  const pipelineStats = pipeline?.pipeline || stats?.pipeline || {};
  const pipelineKnown = Boolean(pipeline?.pipeline || stats?.pipeline);
  const socialJobs = pipeline?.social?.distributionJobs;
  const hasAlerts = (stats?.sourcesWithErrors > 0) || (socialJobs?.failed ?? stats?.distributionFailed) > 0;

  return (
    <AdminLayout title="Dashboard" description="Overview of your newsroom and content pipeline">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Newspaper}
          label="Published Articles"
          value={statsReady ? (stats?.totalArticles || 0).toLocaleString('en-IN') : '…'}
          color="bg-brand-600"
          loading={!statsReady}
        />
        <StatCard
          icon={Users}
          label="Subscribers"
          value={statsReady ? (stats?.subscribers || 0).toLocaleString('en-IN') : '…'}
          sublabel={statsReady ? `${stats?.users || 0} registered users` : undefined}
          color="bg-accent-sky"
          href="/admin/subscribers"
          loading={!statsReady}
        />
        <StatCard
          icon={Rss}
          label="Active Sources"
          value={statsReady ? `${stats?.enabledSources || 0}` : '…'}
          sublabel={statsReady ? `of ${stats?.sources || 0} configured` : undefined}
          color="bg-accent-amber"
          href="/admin/sources"
          loading={!statsReady}
        />
        <StatCard
          icon={Send}
          label="Distribution Queue"
          value={socialJobs?.pending ?? (statsReady ? (stats?.distributionPending ?? 0) : '…')}
          sublabel={socialJobs ? `${(socialJobs.sent || 0).toLocaleString('en-IN')} sent` : undefined}
          color="bg-emerald-600"
          href="/admin/distribution"
          loading={!statsReady && !pipelineReady}
        />
      </div>

      {/* Alert banner */}
      {hasAlerts && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
            {stats?.sourcesWithErrors > 0 && (
              <p><strong>{stats.sourcesWithErrors}</strong> RSS source(s) have fetch errors — <Link href="/admin/sources" className="underline font-medium hover:text-amber-900">review sources</Link>.</p>
            )}
            {(socialJobs?.failed ?? stats?.distributionFailed) > 0 && (
              <p><strong>{socialJobs?.failed ?? stats?.distributionFailed}</strong> failed distribution job(s) — <Link href="/admin/distribution" className="underline font-medium hover:text-amber-900">review queue</Link>.</p>
            )}
          </div>
        </div>
      )}

      {/* Pipeline + Category row */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <SectionCard title="Pipeline Health" icon={Clock} className="lg:col-span-3">
          <div className="flex flex-wrap gap-3">
            <PipelineChip label="Pending" value={pipelineKnown ? (pipelineStats.pending_ai || pipelineStats.pending || 0) : '…'} color="text-amber-600 dark:text-amber-400" loading={!pipelineKnown && !statsReady} />
            <PipelineChip label="Classified" value={pipelineKnown ? (pipelineStats.classified || 0) : '…'} color="text-blue-600 dark:text-blue-400" loading={!pipelineKnown && !statsReady} />
            <PipelineChip label="Published" value={pipelineKnown ? (pipelineStats.processed || pipelineStats.published_articles || 0) : '…'} color="text-green-600 dark:text-green-400" loading={!pipelineKnown && !statsReady} />
            <PipelineChip label="Rejected" value={pipelineKnown ? (pipelineStats.rejected || 0) : '…'} color="text-red-500 dark:text-red-400" loading={!pipelineKnown && !statsReady} />
            <PipelineChip label="Duplicate" value={pipelineKnown ? (pipelineStats.duplicate || 0) : '…'} color="text-gray-500 dark:text-gray-400" loading={!pipelineKnown && !statsReady} />
          </div>
        </SectionCard>

        <SectionCard title="By Category" icon={TrendingUp} className="lg:col-span-2">
          {!statsReady ? (
            <div className="flex items-center justify-center h-[180px]"><Skeleton className="w-36 h-36 rounded-full" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={(stats?.byCategory || []).slice(0, 8)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {(stats?.byCategory || []).slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Recent articles + Language chart */}
      <div className="grid lg:grid-cols-5 gap-4">
        <SectionCard
          title="Recent Articles"
          icon={Newspaper}
          className="lg:col-span-3"
          action={
            <Link href="/desk/review" className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Review queue <ArrowUpRight className="w-3 h-3" />
            </Link>
          }
        >
          {!statsReady ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (stats?.topArticles || []).length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No articles yet</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60 -mx-5">
              {(stats?.topArticles || []).map((article, index) => (
                <div key={article.id || index} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-1 dark:hover:bg-dark-surface-2 transition-colors">
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 w-5 text-right tabular-nums">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    {article.slug ? (
                      <a
                        href={`/article/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-gray-900 dark:text-white truncate leading-snug hover:text-brand-600"
                      >
                        {article.title}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white truncate leading-snug">{article.title}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-surface-2 dark:bg-dark-surface-2 px-2 py-0.5 rounded-md flex-shrink-0">
                    {article.category || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="By Language" icon={TrendingUp} className="lg:col-span-2">
          {!statsReady ? (
            <div className="flex items-center justify-center h-[200px]"><Skeleton className="h-40 w-full" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.byLanguage || []} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v.toLocaleString('en-IN')} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0D7377" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
