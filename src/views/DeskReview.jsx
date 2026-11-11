'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { UserCircle } from 'lucide-react';
import DeskLayout from '../components/DeskLayout';
import PublishDialog, { languageStatus } from '../components/PublishDialog';
import { useAuth } from '../context/AuthContext';
import { deskFetch } from '@/lib/desk-client';

const TABS = [
  { id: 'queue', label: 'Queue' },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'mine', label: 'My drafts' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
];

const DeskReview = () => {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState('queue');
  const [articles, setArticles] = useState([]);
  const [notes, setNotes] = useState({});
  const [openId, setOpenId] = useState('');
  const [editors, setEditors] = useState([]);
  const [publishTarget, setPublishTarget] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    const view = ['queue', 'mine', 'assigned', 'unassigned'].includes(tab) ? tab : null;
    const path = view
      ? `/api/desk/articles?view=${view}`
      : `/api/desk/articles?status=${tab}`;
    const data = await deskFetch(path);
    const rows = data.articles || [];
    setArticles(tab === 'mine' ? rows.filter(item => item.editorialStatus !== 'published') : rows);
  }, [tab]);

  // Load editorial staff for assignment dropdown.
  useEffect(() => {
    if (!isAdmin) return;
    deskFetch('/api/desk/staff?all=0')
      .then(data => setEditors((data.staff || []).filter(s => s.userId)))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    load().catch(err => toast.error(err.message || 'Could not load the queue.'));
  }, [load]);

  const act = async (id, action, extra = {}) => {
    try {
      await deskFetch(`/api/desk/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes: notes[id] || '', ...extra }),
      });
      toast.success(action === 'publish' ? 'Published.' : 'Updated.');
      load();
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not update this draft.');
      return false;
    }
  };

  const confirmPublish = async (choice) => {
    if (!publishTarget) return;
    setPublishing(true);
    const ok = await act(publishTarget.id, 'publish', choice);
    setPublishing(false);
    if (ok) setPublishTarget(null);
  };

  const assignTo = async (articleId, userId) => {
    try {
      await deskFetch(`/api/desk/articles/${articleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'assign', assignTo: userId || null }),
      });
      toast.success(userId ? 'Article assigned.' : 'Assignment removed.');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not assign.');
    }
  };

  const publishDue = async () => {
    try {
      const data = await deskFetch('/api/desk/articles', {
        method: 'POST',
        body: JSON.stringify({ action: 'publish_due' }),
      });
      toast.success(`Published ${data.articles?.length || 0} scheduled draft(s).`);
      for (const item of data.skipped || []) {
        toast.warning(`Not published: ${item.title || 'Untitled'}. ${item.reason}`);
      }
      load();
    } catch (err) {
      toast.error(err.message || 'Could not publish scheduled drafts.');
    }
  };

  const editorName = (userId) => {
    if (!userId) return null;
    const editor = editors.find(e => e.userId === userId);
    return editor?.displayName || null;
  };

  return (
    <DeskLayout
      title="Review queue"
      maxWidth="max-w-4xl"
      actions={<button type="button" onClick={publishDue} className="btn-secondary px-4 py-2 rounded-xl text-sm">Publish scheduled</button>}
    >
      <div className="flex flex-wrap gap-2 mb-6">
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
        {articles.map(article => {
          const assignee = editorName(article.assignedTo);
          const isAssignedToMe = article.assignedTo === user?.id;
          return (
            <article key={article.id} className={`rounded-2xl border ${isAssignedToMe ? 'border-brand-300 dark:border-brand-700' : 'border-stone-200 dark:border-white/10'} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-brand-700 dark:text-brand-300">{article.language} · {article.category} · {article.editorialStatus}</p>
                  <h2 className="font-display font-bold text-xl mt-1">{article.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">By {article.author}</p>
                  {assignee && (
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 flex items-center gap-1">
                      <UserCircle className="w-3.5 h-3.5" /> Assigned to {isAssignedToMe ? 'you' : assignee}
                    </p>
                  )}
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
                  {/* Assignment dropdown */}
                  {isAdmin && editors.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <label className="text-xs text-gray-500">Assign to:</label>
                      <select
                        value={article.assignedTo || ''}
                        onChange={e => assignTo(article.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent"
                      >
                        <option value="">Unassigned</option>
                        {editors.map(ed => (
                          <option key={ed.userId} value={ed.userId}>{ed.displayName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <textarea
                    value={notes[article.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [article.id]: e.target.value }))}
                    rows={2}
                    placeholder="Note for the writer"
                    className="w-full mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" onClick={() => setPublishTarget(article)} className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm">Approve and publish</button>
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
          );
        })}
      </div>
      <PublishDialog
        open={Boolean(publishTarget)}
        title={publishTarget?.title}
        category={publishTarget?.category}
        authorSlug={publishTarget?.authorSlug}
        languages={publishTarget ? languageStatus(publishTarget) : []}
        fixHref={publishTarget ? `/desk/compose?id=${publishTarget.id}` : ''}
        busy={publishing}
        onCancel={() => setPublishTarget(null)}
        onConfirm={confirmPublish}
      />
    </DeskLayout>
  );
};

export default DeskReview;
