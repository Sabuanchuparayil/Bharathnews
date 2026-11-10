'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { DEFAULT_PRAYER_CITY, PRAYER_CITIES } from '@/config/prayer-cities';

const CITIES = PRAYER_CITIES.map(({ id, label }) => ({ id, label }));

const CITY_KEY = 'bn-prayer-city';

export default function UtilityBar() {
  const { language, setLanguage } = useLanguage();
  const [city, setCity] = useState(DEFAULT_PRAYER_CITY);
  const [gold, setGold] = useState(null);
  const [prayer, setPrayer] = useState(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CITY_KEY);
    if (saved && CITIES.some(item => item.id === saved)) setCity(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/nri-rates')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data?.commodities) return;
        setGold(data.commodities.find(item => item.key === 'gold') || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/prayer-times?city=${encodeURIComponent(city)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setPrayer(data?.timings ? data : null);
      })
      .catch(() => {
        if (!cancelled) setPrayer(null);
      });
    return () => { cancelled = true; };
  }, [city]);

  const nextLang = language === 'ml' ? 'en' : 'ml';
  const goldAed = gold?.aedPerGram ? (gold.aedPerGram * 22) / 24 : null;
  const goldInr = gold?.inrPer10g ? (gold.inrPer10g / 10) * (22 / 24) : null;

  return (
    <div className="bg-[#1A1A2E] text-stone-100 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        <Link href="/money/gold-rate-today" className="whitespace-nowrap hover:text-amber-300">
          22K gold
          {goldAed ? ` AED ${goldAed.toFixed(2)}/g` : ''}
          {goldInr ? ` · ₹${Math.round(goldInr)}/g` : ''}
        </Link>
        <span className="text-stone-500" aria-hidden="true">|</span>
        <label className="sr-only" htmlFor="prayer-city">Prayer city</label>
        <select
          id="prayer-city"
          value={city}
          onChange={event => {
            setCity(event.target.value);
            window.localStorage.setItem(CITY_KEY, event.target.value);
          }}
          className="bg-transparent text-stone-100 text-xs outline-none"
        >
          {CITIES.map(item => (
            <option key={item.id} value={item.id} className="text-gray-900">{item.label}</option>
          ))}
        </select>
        <span className="whitespace-nowrap text-stone-300">
          {prayer?.timings?.Fajr ? `Fajr ${prayer.timings.Fajr}` : 'Prayer times'}
          {prayer?.timings?.Maghrib ? ` · Maghrib ${prayer.timings.Maghrib}` : ''}
        </span>
        <button
          type="button"
          onClick={() => setLanguage(nextLang)}
          className="ml-auto whitespace-nowrap rounded-full border border-stone-500 px-2.5 py-0.5 font-semibold tracking-wide hover:border-amber-300 hover:text-amber-300"
          aria-label={nextLang === 'ml' ? 'Read in Malayalam' : 'Read in English'}
        >
          {nextLang === 'ml' ? 'മലയാളം' : 'English'}
        </button>
      </div>
    </div>
  );
}
