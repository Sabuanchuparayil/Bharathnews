'use client';

import React from 'react';
import {
  LayoutGrid, Zap, Globe2, Building2, Briefcase, Cpu, Trophy, Clapperboard, HeartPulse,
  GraduationCap, UserSearch, Home, Plane, MessageSquareQuote,
} from 'lucide-react';
import { CATEGORIES } from '../config/feeds.config';
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

const CategoryFilter = ({ onCategoryChange, activeCategory = 'all' }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
      {CATEGORIES.map(cat => {
        const Icon = CATEGORY_ICONS[cat.id] || LayoutGrid;
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
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
