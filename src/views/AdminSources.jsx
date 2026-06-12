'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ToggleLeft, ToggleRight, AlertCircle, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';
import { getSources, updateSource, createSource, deleteSource } from '../services/admin';
import { getCategoryLabel } from '../utils/categoryColors';

const CATEGORIES = ['india', 'gcc', 'business', 'technology', 'sports', 'entertainment', 'health', 'education', 'jobs', 'realestate', 'world', 'lifestyle', 'opinion'];
const LANGUAGES = ['en', 'hi', 'ml', 'ta', 'kn', 'te', 'bn'];
const TYPES = ['rss', 'googlenews', 'youtube'];

const emptyForm = { name: '', url: '', category: 'india', language: 'en', type: 'rss', enabled: true };

const AdminSources = () => {
  const { isAdmin, loading, user } = useAuth();
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const reload = () => getSources().then(setSources);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  const toggleSource = async (id, enabled) => {
    await updateSource(id, { enabled: !enabled });
    setSources(prev => prev.map(s => s.id === id ? { ...s, enabled: !enabled } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Source name is required');
      return;
    }
    try {
      if (editingId) {
        await updateSource(editingId, form);
        toast.success('Source updated');
      } else {
        await createSource(form);
        toast.success('Source added');
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Failed to save source');
    }
  };

  const startEdit = (src) => {
    setEditingId(src.id);
    setForm({
      name: src.name || '',
      url: src.url || '',
      category: src.category || 'india',
      language: src.language || 'en',
      type: src.type || 'rss',
      enabled: src.enabled !== false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete source "${name}"?`)) return;
    try {
      await deleteSource(id);
      toast.success('Source deleted');
      reload();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Layout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <LoginPrompt nextPath="/admin/sources" showAdminHint />
        </div>
      </Layout>
    );
  }

  const grouped = sources.reduce((acc, s) => {
    const key = s.language || 'en';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-1">Source Manager</h1>
            <p className="text-gray-500 dark:text-gray-400">{sources.length} sources configured</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
            className="btn-primary text-sm px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Source
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="glass-card-solid rounded-2xl p-6 mb-8 space-y-4">
            <h2 className="font-display font-bold text-lg">{editingId ? 'Edit Source' : 'New Source'}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Source name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent"
                required
              />
              <input
                type="url"
                placeholder="Feed URL"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent"
              />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent">
                {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
              </select>
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent">
                {LANGUAGES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary px-4 py-2 rounded-xl text-sm">{editingId ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary px-4 py-2 rounded-xl text-sm">Cancel</button>
            </div>
          </form>
        )}

        {Object.entries(grouped).sort().map(([lang, items]) => (
          <div key={lang} className="mb-8">
            <h2 className="font-display font-bold text-lg mb-3 uppercase">{lang}</h2>
            <div className="space-y-2">
              {items.map(src => (
                <div key={src.id} className="glass-card-solid rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{src.name}</p>
                    <p className="text-xs text-gray-500 truncate">{src.url}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{getCategoryLabel(src.category)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{src.type}</span>
                      {src.lastError && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={() => startEdit(src)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Edit">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button type="button" onClick={() => handleDelete(src.id, src.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30" aria-label="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    <button type="button" onClick={() => toggleSource(src.id, src.enabled)} aria-label={src.enabled ? 'Disable' : 'Enable'}>
                      {src.enabled
                        ? <ToggleRight className="w-8 h-8 text-brand-600" />
                        : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default AdminSources;
