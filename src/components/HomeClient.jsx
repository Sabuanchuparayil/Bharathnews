'use client';

import React, { Suspense } from 'react';
import Home from '@/views/Home';

function HomeFallback() {
  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <h1 className="sr-only">The Bharath News — Breaking News from India &amp; GCC</h1>
      <div className="h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-72 skeleton rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeClient() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <Home />
    </Suspense>
  );
}
