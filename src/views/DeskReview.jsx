'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import DeskGate from '../components/DeskGate';
import { deskFetch } from '@/lib/desk-client';

const TABS = [
  { id: 'queue', label: 'Queue' },
  { id: 'mine', label: 'My drafts' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
];

const DeskReview = () => {
  const [tab, setTab] = useState('queue');
  const [articles, setArticles] = useState([]);
  const [notes, setNotes] = useState({});
  const [openId, setOpenId] = useState('');

  const load = useCallback(async () => {
    const view = tab === 'queue' || tab === 'mine' ? tab : null;
    const path = view
      ? `/api/desk/articles?view=${view}`
      : `/api/desk/articles?status=${tab}`;
    const data = await deskFetch(path);
    const rows = data.articles || [];
    setArticles(tab === 'mine' ? rows.filter(item => item.editorialStatus !== 'published') : rows);
  }, [tab]);

  useEffect(() => {
    load().catch(err => toast.error(err.message || 'Could not load the queue.'));
  }, [load]);

  const act = async (id, action) => {
    try {
      await deskFetch(`/api/desk/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes: notes[id] || '' }),
      });
      toast.success(action === 'publish' ? 'Published.' : 'Updated.');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update this draft.');
    }
  };

  const publishDue = async () => {
    try {
      const data = await deskFetch('/api/desk/articles', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish_due' }),
      });
      toast.success(`Published ${data.articles?.length || 0} scheduled draft(s).`);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not publish scheduled drafts.');
    }
  };

  return (
    <DeskGate>
      <Layout showBottomNav={false} mainClassName="max-w-4xl mx-auto px-4 py-10">
        <Link href="/desk" className="text-sm text-brand-700 dark:text-brand-300">Newsroom</Link>
        <div className="flex items-center justify-between gap-3 mt-2">
          <h1 className="font-display font-bold text-3xl">Review</h1>
          <button type="button" onClick={publishDue} className="btn-secondary px-4 py-2 rounded-xl text-sm">Publish scheduled</button>
        </div>
        <div className="flex flex-wrap gap-2 my-6">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-xl text-sm ${tab === item.id ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {articles.length === 0 && <p className="text-gray-500">Nothing in this list.</p>}
          {articles.map(article => (
            <article key={article.id} className="rounded-2xl border border-stone-200 dark:border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-brand-700 dark:text-brand-300">{article.language} · {article.category} · {article.editorialStatus}</p>
                  <h2 className="font-display font-bold text-xl mt-1">{article.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">By {article.author}{article.isAiAssisted ? ' · AI-assisted' : ''}</p>
                </div>
                {article.imageUrl && <img src={article.imageUrl} alt="" className="w-24 h-16 object-cover rounded-lg" />}
              </div>
              <button type="button" className="text-sm text-brand-700 dark:text-brand-300 mt-3" onClick={() => setOpenId(openId === article.id ? '' : article.id)}>
                {openId === article.id ? 'Hide preview' : 'Preview'}
              </button>
              {openId === article.id && (
                <p className="mt-3 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-64 overflow-auto">{article.fullContent}</p>
              )}
              {article.editorialStatus !== 'published' && (
                <>
                  <textarea
                    value={notes[article.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [article.id]: e.target.value }))}
                    rows={2}
                    placeholder="Note for the writer"
                    className="w-full mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" onClick={() => act(article.id, 'publish')} className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm">Approve and publish</button>
                    <button type="button" onClick={() => act(article.id, 'needs_revision')} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm">Request changes</button>
                    <button type="button" onClick={() => act(article.id, 'reject')} className="px-4 py-2 bg-red-700 text-white rounded-xl text-sm">Reject</button>
                    <Link href={`/desk/compose?id=${article.id}`} className="px-4 py-2 rounded-xl text-sm border border-stone-200 dark:border-white/10">Edit</Link>
                  </div>
                </>
              )}
              {article.editorialStatus === 'published' && article.slug && (
                <Link href={`/article/${article.slug}`} className="inline-block mt-3 text-sm text-brand-700 dark:text-brand-300">Open live article</Link>
              )}
            </article>
          ))}
        </div>
      </Layout>
    </DeskGate>
  );
};

export default DeskReview;
