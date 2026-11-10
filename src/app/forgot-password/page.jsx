import { Suspense } from 'react';
import ForgotPassword from '@/views/ForgotPassword';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Forgot Password',
  description: 'Reset your password for The Bharath News.',
  path: '/forgot-password',
});

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ForgotPassword />
    </Suspense>
  );
}
