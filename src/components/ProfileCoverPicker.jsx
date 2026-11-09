'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { searchImageCatalog } from '@/data/image-catalog';
import { deskAuthHeaders } from '@/lib/desk-client';

export default function ProfileCoverPicker({ imageUrl, onChange }) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);

  const suggest = () => {
    setImages(searchImageCatalog({ query, limit: 8 }));
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const headers = await deskAuthHeaders();
      const signedRes = await fetch('/api/profile/upload-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      const signed = await signedRes.json().catch(() => ({}));
      if (!signedRes.ok) throw new Error(signed.error || 'Could not prepare the upload.');
      const put = await fetch(signed.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!put.ok) throw new Error('Upload failed.');
      onChange(signed.publicUrl);
      toast.success('Cover image uploaded.');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Cover image</label>
      {imageUrl && <img src={imageUrl} alt="" className="w-full h-36 object-cover rounded-xl" />}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search covers: Kerala, Dubai, gold"
          className="flex-1 min-w-[12rem] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
        />
        <button type="button" onClick={suggest} className="btn-secondary px-4 py-2 rounded-xl text-sm">Suggest</button>
        <label className="btn-secondary px-4 py-2 rounded-xl text-sm cursor-pointer">
          {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={busy} onChange={e => upload(e.target.files?.[0])} />
        </label>
      </div>
      <input
        type="url"
        value={imageUrl || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Or paste an image URL"
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
      />
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {images.map(image => (
            <button key={image.url} type="button" onClick={() => onChange(image.url)} className="rounded-xl overflow-hidden border border-transparent hover:border-brand-500">
              <img src={image.thumb || image.url} alt={image.label || ''} className="w-full h-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
