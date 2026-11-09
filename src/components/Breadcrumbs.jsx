'use client';

import React from 'react';
import Link from 'next/link';
import { CATEGORY_ROUTES } from '@/config/category-taxonomy';

export function categoryCrumb(category, label) {
  const key = (category || '').toLowerCase();
  const route = CATEGORY_ROUTES[key];
  return {
    name: label || route?.title || category || 'News',
    href: route?.path || (key ? `/${key}` : '/'),
  };
}

export default function Breadcrumbs({ items }) {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400 mb-3">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-1.5 min-w-0">
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-brand-600 dark:hover:text-brand-400">
                  {item.name}
                </Link>
              ) : (
                <span
                  className="truncate max-w-[14rem] sm:max-w-md text-gray-700 dark:text-gray-200"
                  aria-current={last ? 'page' : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
