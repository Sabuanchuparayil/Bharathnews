'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Coins, Gem, RefreshCw, TrendingUp } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';

const REFRESH_MS = 15 * 60 * 1000;

function RateSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden py-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-32 h-24 skeleton rounded-xl" />
      ))}
    </div>
  );
}

const NriRatesWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch('/api/nri-rates');
      if (!res.ok) throw new Error('Rates unavailable');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const updatedLabel = data?.updatedAt
    ? formatDistanceToNowStrict(new Date(data.updatedAt), { addSuffix: true })
    : null;

  return (
    <section className="py-5 sm:py-6 border-y border-gray-100 dark:border-gray-800/80 bg-gradient-to-b from-brand-50/40 to-transparent dark:from-brand-950/20 dark:to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-950/50 flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                Live Rates
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                GCC currencies, remittance reference &amp; bullion prices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-500 dark:text-gray-400 w-full sm:w-auto">
            {updatedLabel && <span className="flex-1 sm:flex-none">Updated {updatedLabel}</span>}
            <button
              type="button"
              onClick={() => { setLoading(true); load(); }}
              className="btn-ghost p-2 rounded-lg flex-shrink-0"
              aria-label="Refresh rates"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/money"
              className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium hover:underline flex-shrink-0"
            >
              Money news
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading && !data && <RateSkeleton />}

        {error && !data && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
            Rates temporarily unavailable.{' '}
            <button type="button" onClick={load} className="text-brand-600 underline">
              Retry
            </button>
          </p>
        )}

        {data && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-4 h-4 text-accent-amber flex-shrink-0" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  1 unit → Indian Rupee (INR)
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {data.currencies.map((c, i) => (
                  <motion.div
                    key={c.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex-shrink-0 snap-start min-w-[8.25rem] glass-card-solid rounded-xl px-4 py-4 border border-gray-100 dark:border-gray-800"
                  >
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{c.code}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{c.region}</p>
                    <p className="font-display font-bold text-xl text-gray-900 dark:text-white mt-2 tabular-nums leading-tight">
                      {c.display}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">per 1 {c.code}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {data.commodities?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Gem className="w-4 h-4 text-accent-amber flex-shrink-0" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    Gold, Silver &amp; Commodities
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.commodities.map((item, i) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                      className="glass-card-solid rounded-xl px-5 py-4 border border-gray-100 dark:border-gray-800"
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                      <p className="font-display font-bold text-2xl text-gray-900 dark:text-white mt-2 tabular-nums leading-tight">
                        {item.displayIn}
                      </p>
                      {item.displayGulf && (
                        <p className="text-base text-gray-600 dark:text-gray-300 mt-1.5 tabular-nums">
                          {item.displayGulf}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Spot ${formatNum(item.usdPerOz)}/oz · indicative
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pt-1 border-t border-gray-100 dark:border-gray-800/80">
              Indicative mid-market rates for remittances and bullion reference. Not financial advice —
              bank and jeweller rates may differ. Sources: ExchangeRate-API, Gold-API.com.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

function formatNum(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

export default NriRatesWidget;
