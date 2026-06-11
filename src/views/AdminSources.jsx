'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getSources, updateSource } from '../services/admin';
import { getCategoryLabel } from '../utils/categoryColors';

const AdminSources = () => {
  const { isAdmin, loading, user, loginWithGoogle } = useAuth();
  const [sources, setSources] = useState([]);

  useEffect(() => {
    if (isAdmin) getSources().then(setSources);
  }, [isAdmin]);

  const toggleSource = async (id, enabled) => {
    await updateSource(id, { enabled: !enabled });
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !enabled } : s));
  };

  if (loading) return null;
  if (!user) {
    return (
      <Layout showBottomNav={false}>
        <div className="text-center py-20"><button onClick={loginWithGoogle} className="btn-primary">Sign in</button></div>
      </Layout>
    );
  }
  if (!isAdmin) {
    return (
      <Layout showBottomNav={false}>
        <div className="text-center py-20"><p>Admin access required</p></div>
      </Layout>
    );
  }

  const grouped = sources.reduce((acc, s) => {
    const key = s.language || 'en';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="font-display font-bold text-3xl mb-2">Source Manager</h1>
        <p className="text-gray-500 mb-8">{sources.length} sources configured</p>

        {Object.entries(grouped).sort().map(([lang, items]) => (
          <div key={lang} className="mb-8">
            <h2 className="font-display font-bold text-lg mb-3 uppercase">{lang}</h2>
            <div className="space-y-2">
              {items.map(src => (
                <div key={src.id} className="glass-card-solid rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{src.name}</p>
                    <p className="text-xs text-gray-500 truncate">{src.url}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{getCategoryLabel(src.category)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{src.type}</span>
                      {src.lastError && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSource(src.id, src.enabled)}
                    className="ml-4 flex-shrink-0"
                    aria-label={src.enabled ? 'Disable source' : 'Enable source'}
                  >
                    {src.enabled
                      ? <ToggleRight className="w-8 h-8 text-brand-600" />
                      : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default AdminSources;
