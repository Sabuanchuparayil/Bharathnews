'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getSubcategoriesForSection } from '../config/feeds.config';
import { buildNavSubcategoryHref } from '../utils/navLinks';
import { useClickOutside } from '../hooks/useClickOutside';

const MENU_CLASS = 'min-w-[220px] rounded-xl border border-gray-200 bg-white p-1.5 text-gray-800 shadow-floating dark:border-white/15 dark:bg-[#3d3d58] dark:text-stone-50';
const ITEM_CLASS = 'block px-3 py-2 rounded-lg text-sm text-gray-800 hover:bg-brand-50 hover:text-brand-800 dark:text-stone-50 dark:hover:bg-white/10 dark:hover:text-amber-200 transition-colors';

const NavDropdown = ({ link, isActive, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const ref = useRef(null);
  const hoverOpenedAt = useRef(0);
  useClickOutside(ref, open, () => setOpen(false));

  useEffect(() => {
    try {
      setCanHover(Boolean(window.matchMedia?.('(hover: hover) and (pointer: fine)').matches));
    } catch {
      setCanHover(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const subcategories = link.sectionId
    ? getSubcategoriesForSection(link.sectionId).filter(item => item.id !== 'all')
    : [];

  const placeMenu = () => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setAlignRight(rect.left + 240 > window.innerWidth - 12);
  };

  const openMenu = () => {
    placeMenu();
    setOpen(true);
  };

  if (!subcategories.length) {
    return (
      <Link
        href={link.path}
        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${className} ${
          isActive
            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
            : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-white/10'
        }`}
      >
        {link.label}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative shrink-0 ${className}`}
      onMouseEnter={canHover ? () => {
        hoverOpenedAt.current = Date.now();
        openMenu();
      } : undefined}
      onMouseLeave={canHover ? () => {
        hoverOpenedAt.current = 0;
        setOpen(false);
      } : undefined}
    >
      <div className="inline-flex items-center">
        <Link
          href={link.path}
          onClick={() => setOpen(false)}
          className={`px-3 py-2 rounded-l-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            isActive
              ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
              : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-white/10'
          }`}
        >
          {link.label}
        </Link>
        <button
          type="button"
          onClick={() => {
            // Hover opens the menu before this click lands. Keep that first
            // click from immediately closing a menu the reader just asked for.
            if (canHover && Date.now() - hoverOpenedAt.current < 400) {
              openMenu();
              return;
            }
            if (open) {
              setOpen(false);
              return;
            }
            openMenu();
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              openMenu();
            }
          }}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={`${link.label} subcategories`}
          className={`px-1.5 py-2 rounded-r-xl text-sm transition-all duration-200 ${
            isActive || open
              ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
              : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-surface-2 dark:hover:bg-white/10'
          }`}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className={`absolute top-full z-[80] pt-1.5 ${alignRight ? 'right-0' : 'left-0'}`}>
          <div className={MENU_CLASS} role="menu" aria-label={`${link.label} sections`}>
            {subcategories.map(sub => (
              <Link
                key={sub.id}
                href={buildNavSubcategoryHref(link, sub.id)}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={ITEM_CLASS}
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
