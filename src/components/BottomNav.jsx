'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Trophy, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { BOTTOM_NAV } from '../config/feeds.config';

const ICONS = {
  home: Home,
  compass: Compass,
  trophy: Trophy,
  wallet: Wallet,
  user: User,
};

const BottomNav = () => {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {BOTTOM_NAV.map(tab => {
          const Icon = ICONS[tab.icon] || Home;
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              href={tab.path}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-1 bg-brand-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              />
              <span
                className={`text-[11px] mt-1 font-medium transition-colors duration-200 ${
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
