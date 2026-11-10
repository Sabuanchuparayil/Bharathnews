'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { requestPasswordReset } from '@/lib/password-reset';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      setSending(false);
      return;
    }

    try {
      await requestPasswordReset(trimmed);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

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
              Reset Password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {sent
                ? 'Check your email for a password reset link.'
                : 'Enter your email and we\'ll send you a link to reset your password.'}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-xl text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Reset email sent!</p>
                  <p className="mt-1">
                    We sent a password reset link to <strong>{email}</strong>.
                    Please check your inbox (and spam folder) and click the link to set a new password.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setSent(false); setEmail(''); }}
                className="btn-secondary w-full py-3 rounded-xl text-sm"
              >
                Send again with a different email
              </button>
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
                <div>
                  <label htmlFor="reset-email" className="sr-only">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-60"
                >
                  <Mail className="w-5 h-5" />
                  {sending ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-6 text-sm text-gray-500 hover:text-brand-600 w-full justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </Layout>
  );
}
