'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Layout from '../components/Layout';
import { getSupabaseBrowser } from '@/lib/supabase-client';
import { isRecoverySession, readRecoveryHash } from '@/lib/password-reset';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Authentication service unavailable.');
      setChecking(false);
      return;
    }

    let cancelled = false;
    const finish = (session) => {
      if (cancelled) return;
      setSessionReady(isRecoverySession(session));
      setChecking(false);
    };

    const loadRecoverySession = async () => {
      const clearHash = () => {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      };
      const fromLink = readRecoveryHash(window.location.hash);
      if (fromLink?.error) {
        clearHash();
        if (!cancelled) setError(fromLink.error);
        finish(null);
        return;
      }
      if (fromLink) {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: fromLink.accessToken,
          refresh_token: fromLink.refreshToken,
        });
        // Tokens stay in the URL on failure so a reload can retry the same link.
        if (!sessionError) clearHash();
        finish(sessionError ? null : data.session);
        return;
      }
      // Older emails go through /auth/callback, which leaves the recovery session in cookies.
      const { data: { session } } = await supabase.auth.getSession();
      finish(session);
    };

    loadRecoverySession().catch(() => finish(null));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setUpdating(true);

    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        setError('Authentication service unavailable.');
        setUpdating(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!isRecoverySession(session)) {
        setError('This reset session has expired.');
        setSessionReady(false);
        setUpdating(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password.');
        setUpdating(false);
        return;
      }

      // Global sign-out also ends sessions on other devices that may have the old password.
      await supabase.auth.signOut({ scope: 'global' });

      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (checking) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="glass-card-solid rounded-2xl p-8 sm:p-10 max-w-md w-full">
          <div className="text-center mb-6">
            <img
              src="/logo-mark.png"
              alt="The Bharath News"
              width={64}
              height={64}
              className="w-16 h-16 rounded-2xl mx-auto mb-6 shadow-lg"
            />
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {success
                ? 'Your password has been updated successfully!'
                : 'Enter a new password for your account.'}
            </p>
          </div>

          {!sessionReady && !success ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Invalid or expired link</p>
                  <p className="mt-1">
                    {error || 'This password reset link may have expired or already been used.'}
                    {' '}Please request a new one.
                  </p>
                </div>
              </div>
              <Link
                href="/forgot-password"
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-xl text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Password updated!</p>
                  <p className="mt-1">
                    Your password has been changed. Redirecting to sign in…
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl"
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 flex items-start gap-2 text-left text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label htmlFor="new-password" className="sr-only">New Password</label>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="New password (min 8 characters)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
                  />
                </div>

                {password.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <p className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      {password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </p>
                    <p className={confirmPassword.length > 0 && password === confirmPassword ? 'text-green-600' : 'text-gray-500'}>
                      {confirmPassword.length > 0 && password === confirmPassword ? '✓' : '○'} Passwords match
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-60"
                >
                  <Lock className="w-5 h-5" />
                  {updating ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
