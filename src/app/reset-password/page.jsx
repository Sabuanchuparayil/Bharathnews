import { Suspense } from 'react';
import ResetPassword from '@/views/ResetPassword';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Set New Password',
  description: 'Set a new password for your The Bharath News account.',
  path: '/reset-password',
});

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPassword />
    </Suspense>
  );
}
