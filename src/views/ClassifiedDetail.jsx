'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Tag, Calendar, MessageCircle, Phone, Mail } from 'lucide-react';
import Layout from '../components/Layout';
import { getClassifiedBySlug } from '../services/marketplace';
import { countryLabel } from '../lib/marketplace-constants';

const ClassifiedDetail = ({ slug }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    getClassifiedBySlug(slug)
      .then(r => setItem(r.classified))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;
  if (!item) return <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center"><p className="text-gray-500">Listing not found.</p></Layout>;

  const contactLink = item.contact_method === 'whatsapp'
    ? `https://wa.me/${item.contact_value.replace(/[^0-9]/g, '')}`
    : item.contact_method === 'email'
    ? `mailto:${item.contact_value}`
    : `tel:${item.contact_value}`;

  const ContactIcon = item.contact_method === 'whatsapp' ? MessageCircle : item.contact_method === 'email' ? Mail : Phone;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/classifieds" className="text-sm text-brand-600 mb-4 inline-block">&larr; Back to Classifieds</Link>
        <div className="glass-card-solid rounded-2xl overflow-hidden">
          {item.images?.length > 0 && (
            <div>
              <img src={item.images[selectedImage]} alt={item.title} className="w-full h-64 sm:h-96 object-cover" />
              {item.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {item.images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === selectedImage ? 'border-brand-600' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white">{item.title}</h1>
              <p className="text-2xl font-bold text-brand-600 whitespace-nowrap">
                {item.price ? `${item.price_currency} ${item.price}` : item.price_type === 'free' ? 'Free' : item.price_type === 'contact' ? 'Contact for Price' : item.price_type === 'negotiable' ? 'Negotiable' : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{countryLabel(item.country)}{item.city ? `, ${item.city}` : ''}</span>
              <span className="flex items-center gap-1"><Tag className="w-4 h-4" />{item.category}</span>
              <span className="capitalize bg-gray-100 dark:bg-dark-surface-2 px-2 py-0.5 rounded">{item.listing_type}</span>
              {item.price_type !== 'fixed' && <span className="capitalize">{item.price_type}</span>}
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
              <p className="whitespace-pre-wrap">{item.description}</p>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <a href={contactLink} target="_blank" rel="noopener noreferrer" className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2">
                <ContactIcon className="w-4 h-4" /> Contact Seller
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-6 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Posted {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'recently'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClassifiedDetail;
