'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ImagePlus, X } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { createClassified, getClassifiedImageUploadUrl } from '../services/marketplace';
import { GCC_COUNTRIES, CLASSIFIED_CATEGORIES, LISTING_TYPES, PRICE_TYPES, CONTACT_METHODS, MARKETPLACE_LIMITS, countryCurrency } from '../lib/marketplace-constants';

const PostClassified = () => {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', priceCurrency: 'AED', priceType: 'fixed',
    listingType: 'sell', category: 'general', country: 'uae', city: '',
    contactMethod: 'whatsapp', contactValue: '', genderTarget: 'any',
  });

  const handleChange = (e) => {
    setForm(prev => {
      const updated = { ...prev, [e.target.name]: e.target.value };
      if (e.target.name === 'country') updated.priceCurrency = countryCurrency(e.target.value);
      return updated;
    });
  };

  const handleImageUpload = async (files) => {
    if (!files?.length) return;
    if (images.length + files.length > MARKETPLACE_LIMITS.maxClassifiedImages) {
      toast.error(`Maximum ${MARKETPLACE_LIMITS.maxClassifiedImages} images allowed.`);
      return;
    }
    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB.`); continue; }
      try {
        const { uploadUrl, publicUrl } = await getClassifiedImageUploadUrl(file.name, file.type);
        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        setImages(prev => [...prev, publicUrl]);
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createClassified({
        ...form,
        images,
        price: form.price ? (parseFloat(form.price) || null) : null,
      });
      toast.success('Ad submitted for review!');
      router.push('/classifieds/my');
    } catch (err) {
      toast.error(err.message || 'Failed to post classified.');
    }
    setSubmitting(false);
  };

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  if (!user) {
    return (
      <Layout mainClassName="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display font-bold text-2xl mb-4">Sign In Required</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to post a classified ad.</p>
        <button onClick={() => loginWithGoogle('/classifieds/post')} className="btn-primary px-6 py-2.5 rounded-xl">Sign in with Google</button>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Post a Classified Ad</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card-solid rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required maxLength={100} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="What are you selling/renting/offering?" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={4} maxLength={2000} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="Describe your item or service in detail..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Images (max {MARKETPLACE_LIMITS.maxClassifiedImages})</label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {images.length < MARKETPLACE_LIMITS.maxClassifiedImages && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-brand-400">
                  {uploading ? <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /> : <ImagePlus className="w-6 h-6 text-gray-400" />}
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={e => handleImageUpload(e.target.files)} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select name="listingType" value={form.listingType} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {LISTING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {CLASSIFIED_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country *</label>
              <select name="country" value={form.country} onChange={handleChange} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {GCC_COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input name="city" value={form.city} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input name="price" value={form.price} onChange={handleChange} type="number" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="Leave empty for free" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price Type</label>
              <select name="priceType" value={form.priceType} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {PRICE_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Method</label>
              <select name="contactMethod" value={form.contactMethod} onChange={handleChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm">
                {CONTACT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Value *</label>
              <input name="contactValue" value={form.contactValue} onChange={handleChange} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm" placeholder="Phone/email/WhatsApp number" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary px-8 py-3 rounded-xl disabled:opacity-50 w-full sm:w-auto">
          {submitting ? 'Submitting...' : 'Post Ad for Review'}
        </button>
      </form>
    </Layout>
  );
};

export default PostClassified;
