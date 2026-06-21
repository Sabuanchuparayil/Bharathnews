'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getSubcategoriesForSection } from '../config/feeds.config';
import { useClickOutside } from '../hooks/useClickOutside';

const NavDropdown = ({ link, isActive }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, open, () => setOpen(false));

  const subcategories = link.sectionId
    ? getSubcategoriesForSection(link.sectionId).filter(s => s.id !== 'all')
    : [];

  if (!subcategories.length) {
    return (
      <Link
        href={link.path}
        className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-dark-surface-2'
        }`}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={link.path}
        onClick={() => setOpen(false)}
        className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 inline-flex items-center gap-1 ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-dark-surface-2'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {link.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && (
        <div className="absolute top-full left-0 pt-1 z-50 min-w-[200px]">
          <div className="glass-card-solid rounded-xl p-2 shadow-floating border border-gray-100 dark:border-gray-800">
            {subcategories.map(sub => (
              <Link
                key={sub.id}
                href={`${link.path}?sub=${sub.id}`}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-surface-2 dark:hover:bg-dark-surface-2 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
