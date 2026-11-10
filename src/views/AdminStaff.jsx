'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Users } from 'lucide-react';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';
import { deskFetch, deskAuthHeaders } from '@/lib/desk-client';
import { ROLE_TITLES } from '@/lib/staff-profiles-client';

const EMPTY = {
  id: '',
  displayName: '',
  slug: '',
  title: 'Reporter',
  photoURL: '',
  bio: '',
  email: '',
  sortOrder: 100,
  isActive: true,
};

const AdminStaff = () => {
  const { user, isAdmin, loading } = useAuth();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const data = await deskFetch('/api/desk/staff?all=1');
    setStaff(data.staff || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load().catch(err => toast.error(err.message || 'Could not load staff.'));
  }, [isAdmin]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const edit = (person) => {
    setForm({
      id: person.id,
      displayName: person.displayName || '',
      slug: person.slug || '',
      title: person.title || 'Reporter',
      photoURL: person.photoURL || '',
      bio: person.bio || '',
      email: person.email || '',
      sortOrder: person.sortOrder ?? 100,
      isActive: person.isActive !== false,
    });
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const headers = await deskAuthHeaders();
      const signed = await fetch('/api/profile/upload-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileType: file.type }),
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Upload failed.');
        return data;
      });
      const put = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!put.ok) throw new Error('Could not upload the photo.');
      set('photoURL', signed.publicUrl);
      toast.success('Photo uploaded.');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    }
    setUploading(false);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await deskFetch(`/api/desk/staff/${form.id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        toast.success('Staff profile updated.');
      } else {
        await deskFetch('/api/desk/staff', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success('Staff profile created.');
      }
      setForm(EMPTY);
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not save.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt nextPath="/admin/staff" showAdminHint />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Newsroom</p>
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Editorial staff</h1>
            <p className="text-sm text-gray-500 mt-1">Reporters and editors shown on article bylines and the team page.</p>
          </div>
          <Link href="/team" className="btn-secondary px-4 py-2 rounded-xl text-sm">View /team</Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={save} className="rounded-2xl border border-stone-200 dark:border-white/10 p-5 space-y-3">
            <h2 className="font-display font-bold text-xl">{form.id ? 'Edit profile' : 'Add reporter'}</h2>
            <label className="block text-sm">
              Display name
              <input required value={form.displayName} onChange={e => set('displayName', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              Slug
              <input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto from name" className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              Role title
              <select value={ROLE_TITLES.includes(form.title) ? form.title : 'Reporter'} onChange={e => set('title', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm">
                {ROLE_TITLES.map(title => <option key={title} value={title}>{title}</option>)}
              </select>
            </label>
            {!ROLE_TITLES.includes(form.title) && (
              <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm" />
            )}
            <label className="block text-sm">
              Bio
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              Photo URL
              <input value={form.photoURL} onChange={e => set('photoURL', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              Upload photo
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e => uploadPhoto(e.target.files?.[0])} className="mt-1 block w-full text-sm" />
            </label>
            {form.photoURL && <img src={form.photoURL} alt="" className="w-20 h-20 rounded-full object-cover" />}
            <label className="block text-sm">
              Sort order
              <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
              Active on team page and desk picker
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                {form.id ? 'Save changes' : 'Create profile'}
              </button>
              {form.id && (
                <button type="button" onClick={() => setForm(EMPTY)} className="btn-secondary px-4 py-2 rounded-xl text-sm">Cancel</button>
              )}
            </div>
          </form>

          <div className="space-y-3">
            <h2 className="font-display font-bold text-xl flex items-center gap-2"><Users className="w-5 h-5" /> Profiles</h2>
            {staff.map(person => (
              <button
                key={person.id}
                type="button"
                onClick={() => edit(person)}
                className="w-full flex items-center gap-3 rounded-xl border border-stone-200 dark:border-white/10 px-4 py-3 text-left hover:border-brand-400"
              >
                {person.photoURL ? (
                  <img src={person.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center font-semibold">
                    {(person.displayName || '?').slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{person.displayName}</span>
                  <span className="block text-xs text-gray-500">@{person.slug} · {person.title} · {person.isActive === false ? 'inactive' : 'active'}</span>
                </span>
              </button>
            ))}
            {!staff.length && <p className="text-sm text-gray-500">No staff profiles yet.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminStaff;
