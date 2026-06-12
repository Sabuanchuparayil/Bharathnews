'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Shield, AlertCircle, Mail } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, userProfile, loading, loginWithGoogle, loginWithEmail, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const rawNext = searchParams.get('next') || '/dashboard';
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/dashboard';
  const reason = searchParams.get('reason');
  const isAdminFlow = reason === 'admin' || next.startsWith('/admin');
  const isForbidden = reason === 'forbidden';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      try {
        window.top.location.href = window.location.href;
      } catch {
        // Cross-origin frame — CSP frame-ancestors blocks this; nothing more to do
      }
    }
  }, []);

  useEffect(() => {
    if (loading || !user) return;

    if (isAdminFlow) {
      if (!userProfile) return;
      if (!isAdmin) {
        setError('Your account does not have admin access. Contact the site owner.');
        return;
      }
    }

    router.replace(next);
  }, [loading, user, userProfile, isAdmin, isAdminFlow, next, router]);

  const handleGoogleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err?.message || 'Sign in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSigningIn(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError(err?.message || 'Sign in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="glass-card-solid rounded-2xl p-8 sm:p-10 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-6">
              {isAdminFlow ? <Shield className="w-7 h-7 text-white" /> : <LogIn className="w-7 h-7 text-white" />}
            </div>
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">
              {isAdminFlow ? 'Admin Sign In' : 'Sign In'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isForbidden
                ? 'Your account does not have admin access. Sign in with an admin account.'
                : isAdminFlow
                  ? 'Sign in with your admin email or Google account.'
                  : 'Sign in with email or Google to access your account.'}
            </p>
          </div>

          {signingIn && user && isAdminFlow && !userProfile && (
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 text-center">
              Verifying admin access…
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 text-left text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-3 mb-4">
            <div>
              <label htmlFor="login-email" className="sr-only">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="sr-only">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={signingIn || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-60"
            >
              <Mail className="w-5 h-5" />
              {signingIn ? 'Signing in…' : 'Sign in with Email'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-900 px-2 text-gray-500">or</span></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading}
            className="btn-secondary w-full flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-60"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="text-xs text-gray-500 mt-6 text-center">
            By signing in you agree to our{' '}
            <Link href="/terms" className="text-brand-600 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
          </p>

          <Link href="/" className="inline-block mt-4 text-sm text-gray-500 hover:text-brand-600 w-full text-center">
            ← Back to home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
