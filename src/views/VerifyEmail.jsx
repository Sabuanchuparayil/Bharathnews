'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { deskAuthHeaders } from '@/lib/desk-client';

function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  if (value.startsWith('/verify-email') || value.startsWith('/complete-profile') || value.startsWith('/login')) return '/dashboard';
  return value;
}

export default function VerifyEmail() {
  const { user, userProfile, loading, logout, refreshUserProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (loading || !user || !userProfile) return;
    if (userProfile.emailVerified !== true) return;
    const dest = userProfile.profileComplete === false
      ? `/complete-profile?next=${encodeURIComponent(next)}`
      : next;
    router.replace(dest);
  }, [loading, user, userProfile, next, router]);

  const sendCode = async () => {
    setSending(true);
    try {
      const headers = await deskAuthHeaders();
      const res = await fetch('/api/otp/send', { method: 'POST', headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send the code.');
      setSent(true);
      toast.success('Verification code sent.');
    } catch (err) {
      toast.error(err.message || 'Could not send the code.');
    }
    setSending(false);
  };

  const verify = async (event) => {
    event.preventDefault();
    setVerifying(true);
    try {
      const headers = await deskAuthHeaders();
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not verify that code.');
      const profile = await refreshUserProfile();
      toast.success('Email verified.');
      const dest = profile?.profileComplete === false
        ? `/complete-profile?next=${encodeURIComponent(next)}`
        : next;
      router.replace(dest);
    } catch (err) {
      toast.error(err.message || 'Could not verify that code.');
    }
    setVerifying(false);
  };

  if (loading || (user && userProfile && userProfile.emailVerified === true)) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-md mx-auto px-4 py-12">
      <div className="glass-card-solid rounded-2xl p-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Verify your email</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {user?.email
            ? `We will send a 6-digit code to ${user.email}.`
            : 'Sign in to verify the email on your account.'}
        </p>
        {!user ? (
          <a href={`/login?next=${encodeURIComponent('/verify-email')}`} className="btn-primary inline-block px-5 py-2.5 rounded-xl">Sign in</a>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <button type="button" onClick={sendCode} disabled={sending} className="btn-secondary w-full py-2.5 rounded-xl disabled:opacity-50">
              {sending ? 'Sending…' : sent ? 'Send a new code' : 'Send code'}
            </button>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-center text-lg tracking-[0.4em]"
            />
            <button type="submit" disabled={verifying || code.length !== 6} className="btn-primary w-full py-3 rounded-xl disabled:opacity-50">
              {verifying ? 'Checking…' : 'Verify email'}
            </button>
            <button type="button" onClick={logout} className="text-sm text-gray-500 hover:text-red-600 w-full">Sign out</button>
          </form>
        )}
      </div>
    </Layout>
  );
}
