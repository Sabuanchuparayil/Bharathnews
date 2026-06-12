import { Suspense } from 'react';
import Login from '@/views/Login';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Sign In',
  description: 'Sign in to The Bharath News with your Google account.',
  path: '/login',
});

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Login />
    </Suspense>
  );
}
