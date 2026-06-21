'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Trophy, RefreshCw } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';

const REFRESH_MS = 60 * 1000;

function SportIcon({ sport, className = '' }) {
  if (sport === 'cricket') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" strokeDasharray="4 2" />
        <line x1="4" y1="4" x2="20" y2="20" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

function MatchCard({ match, index }) {
  const isLive = match.status === 'inprogress' || match.status === 'live';
  const isUpcoming = match.status === 'upcoming' || match.status === 'notstarted';
  const matchTime = new Date(match.time);

  let timeLabel = '';
  try {
    timeLabel = isUpcoming
      ? formatDistanceToNowStrict(matchTime, { addSuffix: true })
      : isLive
        ? 'LIVE'
        : matchTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    timeLabel = isLive ? 'LIVE' : 'TBD';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex-shrink-0 snap-start min-w-[16rem] sm:min-w-[18rem] rounded-xl border px-4 py-3
        ${isLive
          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
          : 'glass-card-solid border-gray-100 dark:border-gray-800'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <SportIcon sport={match.sport} className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate max-w-[10rem]">
            {match.competition}
          </span>
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wide
          ${isLive ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}
        >
          {timeLabel}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">
            {match.home}
          </span>
          <span className={`text-sm font-bold tabular-nums ${isLive ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
            {match.homeScore ?? '–'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">
            {match.away}
          </span>
          <span className={`text-sm font-bold tabular-nums ${isLive ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
            {match.awayScore ?? '–'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function MatchSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden py-1">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-64 h-24 skeleton rounded-xl" />
      ))}
    </div>
  );
}

export default function LiveSportsWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch('/api/sports-live');
      if (!res.ok) throw new Error('Sports data unavailable');
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

  const hasLive = data?.live?.length > 0;
  const hasUpcoming = data?.upcoming?.length > 0;
  const hasRecent = data?.recent?.length > 0;
  const hasData = hasLive || hasUpcoming || hasRecent;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${hasLive ? 'text-red-500 animate-pulse' : 'text-yellow-600 dark:text-yellow-400'}`} />
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
            {hasLive ? 'Live Now' : 'Live & Upcoming'}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); load(); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Refresh scores"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data && <MatchSkeleton />}

      {error && !data && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
          Live scores temporarily unavailable.{' '}
          <button type="button" onClick={load} className="text-brand-600 underline">Retry</button>
        </p>
      )}

      {data && hasData && (
        <div className="space-y-4">
          {hasLive && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Live</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {data.live.map((m, i) => <MatchCard key={`live-${i}`} match={m} index={i} />)}
              </div>
            </div>
          )}

          {hasUpcoming && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Upcoming</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {data.upcoming.map((m, i) => <MatchCard key={`up-${i}`} match={m} index={i} />)}
              </div>
            </div>
          )}

          {hasRecent && !hasLive && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Recent Results</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {data.recent.map((m, i) => <MatchCard key={`rec-${i}`} match={m} index={i} />)}
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-1">
            {data.attribution} · Updates every 60s
          </p>
        </div>
      )}

      {data && !hasData && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
          No live or upcoming matches right now. Check back soon.
        </p>
      )}
    </div>
  );
}
