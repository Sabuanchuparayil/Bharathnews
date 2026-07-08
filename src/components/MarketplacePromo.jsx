'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, ShoppingBag, ArrowRight } from 'lucide-react';

const MarketplacePromo = () => (
  <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link href="/jobs" className="flex items-center gap-4 glass-card-solid rounded-2xl p-5 hover:shadow-md transition-shadow group">
        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-6 h-6 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">GCC Jobs</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Opportunities for Indian professionals in the Gulf</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
      </Link>
      <Link href="/classifieds" className="flex items-center gap-4 glass-card-solid rounded-2xl p-5 hover:shadow-md transition-shadow group">
        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base text-gray-900 dark:text-white">Classifieds</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Buy, sell, rent across UAE, Saudi, Qatar & more</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
      </Link>
    </div>
  </section>
);

export default MarketplacePromo;
