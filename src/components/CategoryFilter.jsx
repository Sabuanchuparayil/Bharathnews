'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutGrid, Zap, Globe2, Building2, Briefcase, Cpu, Trophy, Clapperboard, HeartPulse,
  GraduationCap, UserSearch, Home, Plane, MessageSquareQuote,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_ROUTES } from '../config/feeds.config';
import { getCategoryColor } from '../utils/categoryColors';

const CATEGORY_ICONS = {
  all: LayoutGrid,
  breaking: Zap,
  india: Globe2,
  gcc: Building2,
  business: Briefcase,
  technology: Cpu,
  sports: Trophy,
  entertainment: Clapperboard,
  health: HeartPulse,
  education: GraduationCap,
  jobs: UserSearch,
  realestate: Home,
  lifestyle: Plane,
  opinion: MessageSquareQuote,
};

/** Resolve active category from the current route when not overridden. */
export function getActiveCategoryFromPath(pathname, override) {
  if (override) return override;
  if (pathname === '/') return 'all';
  const match = Object.entries(CATEGORY_ROUTES).find(([, route]) => route.path === pathname);
  return match ? match[0] : 'all';
}

const CategoryFilter = ({ onCategoryChange, activeCategory }) => {
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

  return (
    <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
      {CATEGORIES.map(cat => {
        const Icon = CATEGORY_ICONS[cat.id] || LayoutGrid;
        const isActive = resolvedActive === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleClick(cat.id)}
            className={`category-pill whitespace-nowrap flex items-center space-x-1.5 ${
              isActive
                ? cat.id === 'all'
                  ? 'category-pill-active'
                  : `${getCategoryColor(cat.id)} ring-2 ring-brand-500/30 font-semibold`
                : 'category-pill-inactive'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
