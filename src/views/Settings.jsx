'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings as SettingsIcon, PenLine } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { CATEGORIES } from '../config/feeds.config';

const INTEREST_CATEGORIES = CATEGORIES.filter(c => !['all', 'breaking'].includes(c.id));

const Settings = () => {
  const { user, userProfile, loginWithGoogle, logout, updateUserInterests, isCreator, role } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { permission, requestPermission } = useNotifications();
  const [selectedInterests, setSelectedInterests] = useState(
    () => Object.keys(userProfile?.interests?.categories || {})
  );
  const [savingInterests, setSavingInterests] = useState(false);

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSaveInterests = async () => {
    if (!user || selectedInterests.length === 0) return;
    setSavingInterests(true);
    const categories = Object.fromEntries(selectedInterests.map(id => [id, 10]));
    await updateUserInterests({ categories, topics: selectedInterests });
    toast.success('Interests updated!');
    setSavingInterests(false);
  };

  return (
    <Layout mainClassName="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center space-x-2 mb-8">
        <SettingsIcon className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="glass-card-solid rounded-2xl divide-y divide-gray-100 dark:divide-gray-800">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark theme</p>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-brand-700' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status: {permission}</p>
          </div>
          <button onClick={requestPermission} className="btn-primary text-sm">
            Enable
          </button>
        </div>

        {user && (
          <div className="p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Your Interests</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize what appears in your For You feed.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {INTEREST_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleInterest(cat.id)}
                  className={`category-pill text-xs ${selectedInterests.includes(cat.id) ? 'category-pill-active' : 'category-pill-inactive'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveInterests}
              disabled={selectedInterests.length === 0 || savingInterests}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {savingInterests ? 'Saving...' : 'Save Interests'}
            </button>
          </div>
        )}

        <div className="p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">Creator Program</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {isCreator ? `You are a ${role}. Manage your content and profile.` : 'Apply to share articles, stories, poems, or videos.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {isCreator ? (
              <>
                <Link href="/creator/space" className="btn-primary text-sm flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5" /> Creator Space
                </Link>
                <Link href="/creator/new" className="btn-secondary text-sm">New Content</Link>
              </>
            ) : (
              <Link href="/creator/apply" className="btn-primary text-sm">Apply as Creator</Link>
            )}
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Account</h3>
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user.photoURL && <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{userProfile?.displayName || user.displayName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <button onClick={logout} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={loginWithGoogle} className="btn-primary">
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
