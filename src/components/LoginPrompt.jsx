'use client';

import Link from 'next/link';

export default function LoginPrompt({
  title = 'Sign In Required',
  description = 'Sign in with your Google account to continue.',
  nextPath = '/dashboard',
  showAdminHint = false,
}) {
  const loginUrl = `/login?next=${encodeURIComponent(nextPath)}${showAdminHint ? '&reason=admin' : ''}`;

  return (
    <div className="glass-card-solid rounded-2xl p-8 text-center max-w-md">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-3">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <Link href={loginUrl} className="btn-primary inline-flex items-center justify-center px-6 py-2.5 rounded-xl">
        Continue to Sign In
      </Link>
    </div>
  );
}
