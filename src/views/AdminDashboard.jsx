'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Eye, TrendingUp, Rss, Settings, Shield } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getAdminStats } from '../services/admin';

const COLORS = ['#4338ca', '#10b981', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card-solid rounded-2xl p-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const { user, isAdmin, loading, loginWithGoogle } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      getAdminStats().then(setStats).catch(() => setStats(null));
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="glass-card-solid rounded-2xl p-8 text-center max-w-md">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Sign In Required</h1>
            <button onClick={loginWithGoogle} className="btn-primary">Sign in with Google</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="glass-card-solid rounded-2xl p-8 text-center max-w-md">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">Admin role required.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const pipeline = stats?.pipeline || {};

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <Link href="/admin/sources" className="btn-secondary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
              <Rss className="w-4 h-4" /> Sources
            </Link>
            <Link href="/admin/moderation" className="btn-secondary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
              <Shield className="w-4 h-4" /> Moderation
            </Link>
            <Link href="/admin/settings" className="btn-secondary text-sm px-4 py-2 rounded-xl flex items-center gap-2">
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Eye} label="Total Views" value={stats?.totalViews?.toLocaleString() || '0'} color="bg-brand-600" />
          <StatCard icon={TrendingUp} label="Published Articles" value={stats?.totalArticles || 0} color="bg-accent-emerald" />
          <StatCard icon={Users} label="Subscribers" value={stats?.subscribers || 0} color="bg-accent-sky" />
          <StatCard icon={Rss} label="Active Sources" value={`${stats?.enabledSources || 0}/${stats?.sources || 0}`} color="bg-accent-amber" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card-solid rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-4">Pipeline Health</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ['Pending', pipeline.pending || 0, 'text-amber-600'],
                ['Classified', pipeline.classified || 0, 'text-blue-600'],
                ['Published', pipeline.processed || 0, 'text-green-600'],
                ['Rejected', pipeline.rejected || 0, 'text-red-600'],
                ['Duplicate', pipeline.duplicate || 0, 'text-gray-500'],
              ].map(([label, val, color]) => (
                <div key={label} className="p-3 rounded-xl bg-surface-2 dark:bg-dark-surface-2">
                  <p className={`text-2xl font-bold ${color}`}>{val}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card-solid rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-4">Articles by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats?.byCategory || []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {(stats?.byCategory || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card-solid rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-lg mb-4">Top Articles</h2>
          <div className="space-y-2">
            {(stats?.topArticles || []).map(a => (
              <div key={a.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-sm truncate flex-1 mr-4">{a.title}</span>
                <span className="text-xs text-gray-500">{a.views || 0} views</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">Articles by Language</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.byLanguage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
