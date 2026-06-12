'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';
import { getSubscribers } from '../services/admin';

const AdminSubscribers = () => {
  const { isAdmin, loading, user } = useAuth();
  const [subscribers, setSubscribers] = useState([]);

  useEffect(() => {
    if (isAdmin) getSubscribers(200).then(setSubscribers);
  }, [isAdmin]);

  if (loading) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt nextPath="/admin/subscribers" showAdminHint />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="font-display font-bold text-3xl mb-2">Newsletter Subscribers</h1>
        <p className="text-gray-500 mb-8">{subscribers.length} subscribers</p>

        <div className="glass-card-solid rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {subscribers.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No subscribers yet</p>
            ) : subscribers.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{sub.email || sub.id}</p>
                  {sub.source && <p className="text-xs text-gray-500">via {sub.source}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSubscribers;
