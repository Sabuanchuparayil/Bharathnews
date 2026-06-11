'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getSiteSettings, updateSiteSettings, getUsers, setUserRole } from '../services/admin';

const AdminSettings = () => {
  const { isAdmin, loading, user, loginWithGoogle } = useAuth();
  const [settings, setSettings] = useState({ qualityThreshold: 6 });
  const [users, setUsers] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getSiteSettings().then(setSettings);
      getUsers().then(setUsers);
    }
  }, [isAdmin]);

  const saveSettings = async () => {
    await updateSiteSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changeRole = async (userId, role) => {
    await setUserRole(userId, role);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  if (loading) return null;
  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false}>
        <div className="text-center py-20">
          {!user ? <button onClick={loginWithGoogle} className="btn-primary">Sign in</button> : <p>Admin access required</p>}
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="font-display font-bold text-3xl mb-8">Site Settings</h1>

        <div className="glass-card-solid rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-lg mb-4">Quality Gate</h2>
          <label className="block text-sm text-gray-600 mb-2">
            Minimum quality score to publish (0-10)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            value={settings.qualityThreshold ?? 6}
            onChange={e => setSettings({ ...settings, qualityThreshold: parseInt(e.target.value, 10) })}
            className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent"
          />
          <button onClick={saveSettings} className="btn-primary ml-4 px-4 py-2 rounded-xl text-sm">
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">User Roles</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium">{u.displayName || u.email}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <select
                  value={u.role || 'reader'}
                  onChange={e => changeRole(u.id, e.target.value)}
                  className="text-sm px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
                >
                  {['reader', 'contributor', 'vlogger', 'content_writer', 'admin'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSettings;
