'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import ProfileDetailsForm from '../components/ProfileDetailsForm';
import { useAuth } from '../context/AuthContext';
import { EMPTY_PROFILE_DETAILS, hasCompleteProfile, profileToDetails, validateProfileDetails } from '@/lib/profile-fields';
import { getCreatorProfileByUserId, saveAccountProfile, updateCreatorProfile } from '../services/creator';

function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  if (value.startsWith('/verify-email') || value.startsWith('/complete-profile') || value.startsWith('/login')) return '/dashboard';
  return value;
}

export default function CompleteProfile() {
  const { user, userProfile, loading, logout, refreshUserProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [values, setValues] = useState(EMPTY_PROFILE_DETAILS);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    if (userProfile?.emailVerified === false) {
      router.replace(`/verify-email?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!userProfile) {
      setReady(true);
      return;
    }
    if (hasCompleteProfile(userProfile)) {
      router.replace(next);
      return;
    }
    if (!seeded.current) {
      setValues(profileToDetails(userProfile));
      seeded.current = true;
    }
    setReady(true);
  }, [loading, user, userProfile, next, router]);

  const save = async (event) => {
    event.preventDefault();
    const parsed = validateProfileDetails(values);
    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }
    setSaving(true);
    try {
      const userId = user.id || user.uid;
      await saveAccountProfile(userId, parsed.value);
      const creator = await getCreatorProfileByUserId(userId);
      if (creator?.slug) {
        await updateCreatorProfile(creator.slug, {
          country: parsed.value.country,
          city: parsed.value.city,
          profession: parsed.value.profession,
          location: parsed.value.location,
        });
      }
      await refreshUserProfile();
      toast.success('Profile saved.');
      router.replace(next);
    } catch (err) {
      toast.error(err.message || 'Could not save your profile.');
    }
    setSaving(false);
  };

  if (loading || !ready) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-xl mx-auto px-4 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Your details</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Tell us where you live. This helps Bharath News know the community you write and read from.</p>
      {!user ? (
        <a href="/login?next=/complete-profile" className="btn-primary inline-block px-5 py-2.5 rounded-xl">Sign in</a>
      ) : (
        <form onSubmit={save} className="glass-card-solid rounded-2xl p-6 space-y-6">
          <ProfileDetailsForm values={values} onChange={setValues} />
          <button type="submit" disabled={saving} className="btn-primary px-6 py-3 rounded-xl disabled:opacity-50">
            {saving ? 'Saving…' : 'Save and continue'}
          </button>
          <button type="button" onClick={logout} className="block text-sm text-gray-500 hover:text-red-600">Sign out</button>
        </form>
      )}
    </Layout>
  );
}
