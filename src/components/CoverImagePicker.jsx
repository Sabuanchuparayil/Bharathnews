'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { deskFetch } from '@/lib/desk-client';

const CoverImagePicker = ({ category, imageUrl, imageCredit, onChange }) => {
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [images, setImages] = useState([]);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (nextOffset = 0) => {
    setBusy(true);
    try {
      const params = new URLSearchParams({
        q: query,
        category: category || '',
        offset: String(nextOffset),
      });
      const data = await deskFetch(`/api/desk/images?${params.toString()}`);
      setImages(data.images || []);
      setSource(data.source || '');
      setOffset(nextOffset);
    } catch (err) {
      toast.error(err.message || 'Could not load images.');
    }
    setBusy(false);
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const signed = await deskFetch('/api/desk/upload-image', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const put = await fetch(signed.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!put.ok) throw new Error('Upload failed.');
      onChange({ imageUrl: signed.publicUrl, imageCredit: '' });
      toast.success('Cover image uploaded.');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search covers: Kerala, Dubai, gold, cricket"
          className="flex-1 min-w-[12rem] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
        />
        <button type="button" onClick={() => search(0)} disabled={busy} className="btn-secondary px-4 py-2 rounded-xl text-sm">
          Suggest
        </button>
        <button type="button" onClick={() => search(offset + 8)} disabled={busy || images.length === 0} className="btn-secondary px-4 py-2 rounded-xl text-sm">
          More
        </button>
      </div>
      {source === 'catalog' && images.length > 0 && (
        <p className="text-xs text-gray-500">Showing the newsroom catalog. Add UNSPLASH_ACCESS_KEY on the server to search the full Unsplash library.</p>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {images.map(image => (
            <button
              key={image.url}
              type="button"
              onClick={() => onChange({ imageUrl: image.url, imageCredit: image.credit || '' })}
              className={`rounded-xl overflow-hidden border ${imageUrl === image.url ? 'border-brand-600 ring-2 ring-brand-600' : 'border-stone-200 dark:border-white/10'}`}
            >
              <img src={image.thumb || image.url} alt={image.label || ''} className="h-20 w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium">Upload from this device</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block w-full text-sm"
            onChange={e => upload(e.target.files?.[0])}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Or paste an image URL</span>
          <input
            type="url"
            value={imageUrl || ''}
            onChange={e => {
              let nextUrl = e.target.value.trim();
              if (nextUrl.includes('images.unsplash.com') && !nextUrl.includes('editorial=1')) {
                nextUrl += nextUrl.includes('?') ? '&editorial=1' : '?editorial=1';
              }
              onChange({
                imageUrl: nextUrl,
                imageCredit: nextUrl.includes('unsplash.com') ? (imageCredit || 'Photo: Unsplash') : '',
              });
            }}
            placeholder="https://"
            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
          />
        </label>
      </div>
      {imageUrl && (
        <div>
          <img src={imageUrl} alt="" className="h-40 w-full object-cover rounded-xl" />
          {imageCredit && <p className="text-xs text-gray-500 mt-1">{imageCredit}</p>}
        </div>
      )}
    </div>
  );
};

export default CoverImagePicker;
