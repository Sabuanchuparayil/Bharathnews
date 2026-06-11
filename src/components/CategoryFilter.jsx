'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutGrid, Zap, Globe2, Building2, Briefcase, Cpu, Trophy, Clapperboard, HeartPulse,
  GraduationCap, UserSearch, Home, Plane, MessageSquareQuote,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_ROUTES } from '../config/feeds.config';
import { getCategoryPillClasses } from '../utils/categoryColors';
import { CATEGORY_ICONS } from '../utils/categoryIcons';

/** Resolve active category from the current route when not overridden. */
export function getActiveCategoryFromPath(pathname, override) {
  if (override) return override;
  if (pathname === '/') return 'all';
  const match = Object.entries(CATEGORY_ROUTES).find(([, route]) => route.path === pathname);
  return match ? match[0] : 'all';
}

const CategoryFilter = ({
  onCategoryChange,
  activeCategory,
  showLabel = false,
  categories = CATEGORIES,
  /** Extend scroll area to container edges (use on pages without sticky-section-header padding). */
  edgeToEdge = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedActive = getActiveCategoryFromPath(pathname, activeCategory);

  const handleClick = (catId) => {
    if (catId === 'all') {
      if (pathname !== '/') router.push('/');
      else onCategoryChange?.('all');
      return;
    }
    if (catId === 'breaking') {
      if (pathname !== '/') router.push('/?category=breaking');
      else onCategoryChange?.('breaking');
      return;
    }
    const route = CATEGORY_ROUTES[catId];
    if (route) {
      router.push(route.path);
      return;
    }
    onCategoryChange?.(catId);
  };

  const scrollPad = edgeToEdge ? '-mx-4 sm:-mx-6 px-4 sm:px-6' : '';

  return (
    <div className="min-w-0">
      {showLabel && (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
          Categories
        </p>
      )}
      <div className={`relative min-w-0 ${scrollPad}`}>
        <div
          className="overflow-x-auto scrollbar-hide overscroll-x-contain pb-2 pt-0.5"
          role="tablist"
          aria-label="Categories"
        >
          <div className="flex gap-2 w-max pr-1">
            {categories.map(cat => {
              const Icon = CATEGORY_ICONS[cat.id] || LayoutGrid;
              const isActive = resolvedActive === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleClick(cat.id)}
                  className={`category-pill flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 ${getCategoryPillClasses(cat.id, isActive)}`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-surface-1 dark:from-dark-surface-0 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface-1 dark:from-dark-surface-0 to-transparent" />
      </div>
    </div>
  );
};

export default CategoryFilter;
