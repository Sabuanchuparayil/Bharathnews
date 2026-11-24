'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { DEFAULT_PRAYER_CITY, PRAYER_CITIES } from '@/config/prayer-cities';

const CITIES = PRAYER_CITIES.map(({ id, label }) => ({ id, label }));
const CITY_KEY = 'bn-prayer-city';
const RATES_EVENT = 'bn-nri-rates';

function CityMenu({ city, onChange, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const setMenuOpen = (value) => {
    setOpen(value);
    onOpenChange(value);
  };
  useClickOutside(ref, open, () => setMenuOpen(false));
  const current = CITIES.find(item => item.id === city) || CITIES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        id="prayer-city"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Prayer city: ${current.label}`}
        onClick={() => setMenuOpen(!open)}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-semibold text-stone-50 hover:bg-white/10 hover:text-amber-200"
      >
        <span>{current.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Prayer city"
          className="absolute left-0 top-full z-[80] mt-1.5 max-h-80 w-44 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 text-sm text-gray-900 shadow-floating dark:border-white/15 dark:bg-[#3d3d58] dark:text-stone-50"
        >
          {CITIES.map(item => {
            const selected = item.id === city;
            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(item.id);
                    setMenuOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left hover:bg-brand-50 hover:text-brand-800 dark:hover:bg-white/10 dark:hover:text-amber-200 ${
                    selected ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-white/10 dark:text-amber-200' : ''
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function UtilityBar() {
  const { language, setLanguage } = useLanguage();
  const [city, setCity] = useState(DEFAULT_PRAYER_CITY);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [gold, setGold] = useState(null);
  const [prayer, setPrayer] = useState(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CITY_KEY);
    if (saved && CITIES.some(item => item.id === saved)) setCity(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const apply = (data) => {
      if (cancelled || !data?.commodities) return;
      setGold(data.commodities.find(item => item.key === 'gold') || null);
    };
    fetch('/api/nri-rates')
      .then(res => (res.ok ? res.json() : null))
      .then(apply)
      .catch(() => {});
    const onRates = (event) => apply(event.detail);
    window.addEventListener(RATES_EVENT, onRates);
    return () => {
      cancelled = true;
      window.removeEventListener(RATES_EVENT, onRates);
    };
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

  const selectCity = (next) => {
    setCity(next);
    window.localStorage.setItem(CITY_KEY, next);
  };

  return (
    <div className={`relative bg-[#1A1A2E] text-stone-100 text-xs overflow-visible ${cityMenuOpen ? 'z-[60]' : 'z-30'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center gap-3 overflow-visible">
        <Link href="/money/gold-rate-today" className="min-w-0 truncate hover:text-amber-300">
          22K gold
          {goldAed ? ` AED ${goldAed.toFixed(2)}/g` : ''}
          {goldInr ? ` · ₹${Math.round(goldInr)}/g` : ''}
        </Link>
        <span className="shrink-0 text-stone-500" aria-hidden="true">|</span>
        <CityMenu city={city} onChange={selectCity} onOpenChange={setCityMenuOpen} />
        <span className="min-w-0 truncate text-stone-300">
          {prayer?.timings?.Fajr ? `Fajr ${prayer.timings.Fajr}` : 'Prayer times'}
          {prayer?.timings?.Maghrib ? ` · Maghrib ${prayer.timings.Maghrib}` : ''}
        </span>
        <button
          type="button"
          onClick={() => setLanguage(nextLang)}
          className="ml-auto shrink-0 whitespace-nowrap rounded-full border border-stone-500 px-2.5 py-0.5 font-semibold tracking-wide hover:border-amber-300 hover:text-amber-300"
          aria-label={nextLang === 'ml' ? 'Read in Malayalam' : 'Read in English'}
        >
          {nextLang === 'ml' ? 'മലയാളം' : 'English'}
        </button>
      </div>
    </div>
  );
}
