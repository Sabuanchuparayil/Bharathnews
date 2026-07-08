'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, MapPin, Tag } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getApprovedClassifieds } from '../services/marketplace';
import { GCC_COUNTRIES, CLASSIFIED_CATEGORIES, LISTING_TYPES, countryLabel } from '../lib/marketplace-constants';

const ClassifiedCard = ({ item }) => (
  <Link href={`/classifieds/${item.slug}`} className="glass-card-solid rounded-2xl overflow-hidden hover:shadow-lg transition-shadow block">
    {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-40 object-cover" />}
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h3>
        <span className="text-sm font-bold text-brand-600 whitespace-nowrap">
          {item.price ? `${item.price_currency} ${item.price}` : item.price_type === 'free' ? 'Free' : item.price_type === 'contact' ? 'Contact' : ''}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{countryLabel(item.country)}{item.city ? `, ${item.city}` : ''}</span>
        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.category}</span>
        <span className="capitalize">{item.listing_type}</span>
      </div>
    </div>
  </Link>
);

const ClassifiedsBoard = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [listingType, setListingType] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (country) params.country = country;
      if (category) params.category = category;
      if (listingType) params.listing_type = listingType;
      const res = await getApprovedClassifieds(params);
      setItems(res.classifieds || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [country, category, listingType]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Classifieds</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Buy, sell, rent, and find services across the Gulf</p>
          </div>
          {user && <Link href="/classifieds/post" className="btn-primary px-5 py-2.5 rounded-xl text-sm whitespace-nowrap">Post Ad Free</Link>}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select value={country} onChange={e => setCountry(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-2 text-sm">
            <option value="">All Countries</option>
            {GCC_COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-2 text-sm">
            <option value="">All Categories</option>
            {CLASSIFIED_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={listingType} onChange={e => setListingType(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-2 text-sm">
            <option value="">All Types</option>
            {LISTING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No classifieds posted yet.</p>
            {user && <p className="text-sm text-gray-400 mt-2"><Link href="/classifieds/post" className="text-brand-600 underline">Post the first ad</Link></p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => <ClassifiedCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassifiedsBoard;
