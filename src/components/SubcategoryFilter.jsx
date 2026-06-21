'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSubcategoriesForSection } from '../config/feeds.config';

const SubcategoryFilter = ({ sectionId, activeSubcategory = 'all', basePath }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subcategories = getSubcategoriesForSection(sectionId);

  if (!subcategories.length || subcategories.length <= 1) return null;

  const handleClick = (subId) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (subId === 'all') {
      params.delete('sub');
    } else {
      params.set('sub', subId);
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  return (
    <div className="relative min-w-0 -mx-1">
      <div
        className="overflow-x-auto scrollbar-hide overscroll-x-contain pb-1 pt-0.5"
        role="tablist"
        aria-label="Subcategories"
      >
        <div className="flex gap-2 w-max pr-1">
          {subcategories.map(sub => {
            const isActive = activeSubcategory === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleClick(sub.id)}
                className={`category-pill flex-shrink-0 whitespace-nowrap text-sm px-3.5 py-1.5 rounded-full transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-700 dark:hover:text-brand-300'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubcategoryFilter;
