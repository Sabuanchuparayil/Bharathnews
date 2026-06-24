'use client';

import React, { Suspense } from 'react';
import SectionPage from './SectionPage';

function SectionFallback() {
  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <div className="h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <div className="h-10 skeleton w-48 rounded-xl" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 skeleton rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage(props) {
  return (
    <Suspense fallback={<SectionFallback />}>
      <SectionPage {...props} />
    </Suspense>
  );
}
