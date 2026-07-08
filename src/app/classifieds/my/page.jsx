'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { getMyClassifieds } from '@/services/marketplace';
import { countryLabel } from '@/lib/marketplace-constants';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

export default function MyClassifiedsPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user) {
      getMyClassifieds().then(r => setItems(r.classifieds || [])).catch(() => {}).finally(() => setFetching(false));
    } else {
      setFetching(false);
    }
  }, [user]);

  if (loading || fetching) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  if (!user) {
    return (
      <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="mb-4">Sign in to view your ads.</p>
        <button onClick={() => loginWithGoogle('/classifieds/my')} className="btn-primary px-6 py-2.5 rounded-xl">Sign in</button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl">My Classifieds</h1>
          <Link href="/classifieds/post" className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> New Ad</Link>
        </div>
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No classified ads yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="glass-card-solid rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.category} — {countryLabel(item.country)}{item.price ? ` | ${item.price_currency} ${item.price}` : ''}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[item.status] || ''}`}>{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
