'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { UserCircle } from 'lucide-react';
import DeskLayout from '../components/DeskLayout';
import PublishDialog, { languageStatus } from '../components/PublishDialog';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { capsAllow } from '@/lib/access-roles';
import { deskFetch } from '@/lib/desk-client';
import ArticleText from '../components/ArticleText';
import { getCategoryLabel } from '../utils/categoryColors';
import { articleCategoryIds } from '@/config/category-taxonomy';

const TABS = [
  { id: 'queue', label: 'Queue' },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'mine', label: 'My drafts' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
];

const DeskReview = () => {
  const { user, caps } = useAuth();
  const { settings } = useSiteSettings();
  const canPublish = capsAllow(caps, 'publish');
  const canAssign = capsAllow(caps, 'assign');
  const canCorrect = capsAllow(caps, 'correct');
  const [tab, setTab] = useState('queue');
  const [articles, setArticles] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [notes, setNotes] = useState({});
  const [corrections, setCorrections] = useState({});
  const [openId, setOpenId] = useState('');
  const [openingId, setOpeningId] = useState('');
  const [editors, setEditors] = useState([]);
  const [publishTarget, setPublishTarget] = useState(null);
  const prepareGeneration = useRef(0);
  const [publishing, setPublishing] = useState(false);
  const [preparingId, setPreparingId] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async (offset = 0) => {
    const view = ['queue', 'mine', 'assigned', 'unassigned'].includes(tab) ? tab : null;
    const path = view
      ? `/api/desk/articles?view=${view}&offset=${offset}`
      : `/api/desk/articles?status=${tab}&offset=${offset}`;
    const data = await deskFetch(path);
    const rows = tab === 'mine'
      ? (data.articles || []).filter(item => item.editorialStatus !== 'published')
      : (data.articles || []);
    setArticles(prev => (offset ? [...prev, ...rows] : rows));
    setHasMore(Boolean(data.hasMore));
    setLoadError('');
  }, [tab]);

  useEffect(() => {
    deskFetch('/api/desk/staff?all=0')
      .then(data => setEditors((data.staff || []).filter(s => s.userId)))
      .catch(() => setEditors([]));
  }, []);

  useEffect(() => {
    load(0).catch(err => setLoadError(err.message || 'Could not load the queue.'));
  }, [load]);

  const act = async (id, action, extra = {}) => {
    try {
      await deskFetch(`/api/desk/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, notes: notes[id] || '', ...extra }),
      });
      toast.success(action === 'publish' ? 'Published.' : action === 'reject' ? 'Rejected.' : action === 'correct' ? 'Correction saved.' : 'Updated.');
      load();
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not update this draft.');
      return false;
    }
  };

  const ensureArticle = async (article) => {
    if (article.fullContent) return article;
    const data = await deskFetch(`/api/desk/articles/${article.id}`);
    const next = { ...article, ...(data.article || {}) };
    setArticles(prev => prev.map(item => (item.id === article.id ? next : item)));
    return next;
  };

  const openPreview = async (article) => {
    if (openId === article.id) {
      setOpenId('');
      return;
    }
    setOpenId(article.id);
    if (article.fullContent) return;
    setOpeningId(article.id);
    try {
      await ensureArticle(article);
    } catch (err) {
      toast.error(err.message || 'Could not open this story.');
    }
    setOpeningId('');
  };

  const openPublish = async (article) => {
    try {
      setOpeningId(article.id);
      const full = await ensureArticle(article);
      setPublishTarget(full);
    } catch (err) {
      toast.error(err.message || 'Could not open this story.');
    }
    setOpeningId('');
  };

  const confirmPublish = async (choice) => {
    if (!publishTarget) return;
    setPublishing(true);
    const ok = await act(publishTarget.id, 'publish', choice);
    setPublishing(false);
    if (ok) setPublishTarget(null);
  };

  const partnerFor = (article) => {
    const language = article?.language === 'ml' ? 'ml' : article?.language === 'en' ? 'en' : '';
    if (!language) return null;
    const code = language === 'ml' ? 'en' : 'ml';
    const label = code === 'en' ? 'English' : 'Malayalam';
    const skipped = code === 'en' ? article.skipEnglish === true : article.skipMalayalam === true;
    const version = article.translations?.[code] || null;
    const ready = String(version?.title || '').trim().length >= 4
      && String(version?.fullContent || '').trim().length >= 40;
    return { code, label, skipped, ready, version };
  };

  const preparePartner = async (article) => {
    const partner = partnerFor(article);
    if (!partner || partner.skipped) return;
    setPreparingId(article.id);
    try {
      const full = await ensureArticle(article);
      const data = await deskFetch('/api/desk/translate-draft', {
        method: 'POST',
        body: JSON.stringify({
          id: full.id,
          language: full.language,
          title: full.title,
          summary: full.summary,
          fullContent: full.fullContent,
          skipEnglish: full.skipEnglish === true,
          skipMalayalam: full.skipMalayalam === true,
          force: partner.ready,
          translations: full.translations || {},
        }),
      });
      const next = {
        ...full,
        translations: data.translations || {},
        skipEnglish: data.skipEnglish === true,
        skipMalayalam: data.skipMalayalam === true,
      };
      setArticles(prev => prev.map(item => (item.id === article.id ? { ...item, ...next } : item)));
      if (publishTarget?.id === article.id) setPublishTarget(prev => (prev ? { ...prev, ...next } : prev));
      if (!data.prepared) throw new Error(data.warning || `The ${partner.label} version could not be prepared.`);
      toast.success(`${partner.label} version is ready. Read it before you publish.`);
    } catch (err) {
      toast.error(err.message || `Could not prepare the ${partner.label} version.`);
    }
    setPreparingId('');
  };

  const prepareLanguages = async (choice = {}) => {
    if (!publishTarget) return;
    const generation = prepareGeneration.current + 1;
    prepareGeneration.current = generation;
    const articleId = publishTarget.id;
    const data = await deskFetch('/api/desk/translate-draft', {
      method: 'POST',
      body: JSON.stringify({
        id: articleId,
        language: publishTarget.language,
        title: publishTarget.title,
        summary: publishTarget.summary,
        fullContent: publishTarget.fullContent,
        skipEnglish: choice.skipEnglish === true,
        skipMalayalam: choice.skipMalayalam === true,
        translations: publishTarget.translations || {},
      }),
    });
    if (generation !== prepareGeneration.current) return;
    const skipEnglish = data.skipEnglish === true && publishTarget.language !== 'en';
    const skipMalayalam = data.skipMalayalam === true && publishTarget.language !== 'ml';
    const translations = { ...(data.translations || {}) };
    if (skipEnglish) delete translations.en;
    if (skipMalayalam) delete translations.ml;
    const next = { translations, skipEnglish, skipMalayalam };
    setPublishTarget(prev => (prev && prev.id === articleId ? { ...prev, ...next } : prev));
    setArticles(prev => prev.map(item => (item.id === articleId ? { ...item, ...next } : item)));
    if (!data.prepared) throw new Error(data.warning || 'The other language could not be prepared.');
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
      actions={canPublish ? <button type="button" onClick={publishDue} className="btn-secondary px-4 py-2 rounded-xl text-sm">Publish scheduled</button> : null}
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
      {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}
      <div className="space-y-4">
        {articles.length === 0 && !loadError && <p className="text-gray-500">Nothing in this list.</p>}
        {articles.map(article => {
          const assignee = editorName(article.assignedTo);
          const isAssignedToMe = article.assignedTo === user?.id;
          const partner = partnerFor(article);
          const preparing = preparingId === article.id;
          return (
            <article key={article.id} className={`rounded-2xl border ${isAssignedToMe ? 'border-brand-300 dark:border-brand-700' : 'border-stone-200 dark:border-white/10'} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-brand-700 dark:text-brand-300">{article.language} · {articleCategoryIds(article).map(getCategoryLabel).join(', ')} · {article.editorialStatus}</p>
                  <h2 className="font-display font-bold text-xl mt-1"><ArticleText text={article.title} /></h2>
                  {partner && !partner.skipped && (
                    <div className="mt-3 rounded-xl bg-stone-50 dark:bg-white/5 px-3 py-2">
                      <p className="text-xs uppercase text-gray-500">{partner.label} draft</p>
                      {partner.ready ? (
                        <>
                          <p className="font-medium mt-1"><ArticleText text={partner.version.title} /></p>
                          {partner.version.summary && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1"><ArticleText text={partner.version.summary} /></p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Machine draft. Read it before you publish.</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">No {partner.label} version yet.</p>
                      )}
                      {article.editorialStatus !== 'published' && (
                        <button
                          type="button"
                          onClick={() => preparePartner(article)}
                          disabled={preparing}
                          className="mt-2 px-4 py-2 rounded-xl text-sm bg-brand-600 text-white disabled:opacity-50"
                        >
                          {preparing ? 'Preparing…' : partner.ready ? `Prepare ${partner.label} again` : `Prepare ${partner.label}`}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-1">By {article.author}</p>
                  {assignee && (
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 flex items-center gap-1">
                      <UserCircle className="w-3.5 h-3.5" /> Assigned to {isAssignedToMe ? 'you' : assignee}
                    </p>
                  )}
                </div>
                {article.imageUrl && <img src={article.imageUrl} alt="" className="w-24 h-16 object-cover rounded-lg" />}
              </div>
              <button type="button" className="text-sm text-brand-700 dark:text-brand-300 mt-3" onClick={() => openPreview(article)}>
                {openingId === article.id ? 'Opening…' : openId === article.id ? 'Hide preview' : 'Preview'}
              </button>
              {openId === article.id && (
                <div className="mt-3 space-y-3">
                  {!article.fullContent && <p className="text-sm text-gray-500">Opening the story…</p>}
                  {article.fullContent && <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-64 overflow-auto"><ArticleText text={article.fullContent} /></p>}
                  {article.language === 'ml' && article.skipEnglish !== true && article.translations?.en?.fullContent && (
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-64 overflow-auto border-t border-stone-200 dark:border-white/10 pt-3"><ArticleText text={article.translations.en.fullContent} /></p>
                  )}
                  {article.language === 'en' && article.skipMalayalam !== true && article.translations?.ml?.fullContent && (
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-64 overflow-auto border-t border-stone-200 dark:border-white/10 pt-3"><ArticleText text={article.translations.ml.fullContent} /></p>
                  )}
                </div>
              )}
              {article.editorialStatus !== 'published' && (
                <>
                  {/* Assignment dropdown */}
                  {canAssign && editors.length > 0 && (
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
                    placeholder="Note for the writer. A note is required to reject."
                    className="w-full mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {canPublish && article.editorialStatus !== 'rejected' && (
                      <>
                        <button type="button" onClick={() => openPublish(article)} disabled={openingId === article.id} className="px-4 py-2 bg-green-700 text-white rounded-xl text-sm disabled:opacity-50">Approve and publish</button>
                        <button type="button" onClick={() => act(article.id, 'needs_revision')} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm">Request changes</button>
                      </>
                    )}
                    {article.editorialStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => {
                          const note = (notes[article.id] || '').trim();
                          if (note.length < 8) {
                            toast.error('Add a short note explaining why this story is rejected.');
                            return;
                          }
                          if (!window.confirm(`Reject “${article.title}”? It leaves the queue and is not published.`)) return;
                          act(article.id, 'reject');
                        }}
                        className="px-4 py-2 bg-red-700 text-white rounded-xl text-sm"
                      >
                        Reject
                      </button>
                    )}
                    <Link href={`/desk/compose?id=${article.id}`} className="px-4 py-2 rounded-xl text-sm border border-stone-200 dark:border-white/10">Edit</Link>
                  </div>
                </>
              )}
              {article.editorialStatus === 'published' && (
                <div className="mt-3 space-y-2">
                  {article.slug && (
                    <Link href={`/article/${article.slug}`} className="inline-block text-sm text-brand-700 dark:text-brand-300">Open live article</Link>
                  )}
                  {canCorrect && (
                    <>
                      <textarea
                        value={corrections[article.id] ?? article.correctionNote ?? ''}
                        onChange={e => setCorrections(prev => ({ ...prev, [article.id]: e.target.value }))}
                        rows={2}
                        placeholder="Correction readers will see"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-3 py-2 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => act(article.id, 'correct', { noteOnly: true, correctionNote: corrections[article.id] ?? article.correctionNote ?? '' })} className="px-4 py-2 rounded-xl text-sm border border-stone-200 dark:border-white/10">Save correction</button>
                        <button type="button" onClick={() => act(article.id, 'unpublish')} className="px-4 py-2 bg-red-700 text-white rounded-xl text-sm">Unpublish</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {hasMore && (
          <button type="button" onClick={() => load(articles.length).catch(err => setLoadError(err.message || 'Could not load more.'))} className="btn-secondary px-4 py-2 rounded-xl text-sm">
            Load more
          </button>
        )}
      </div>
      <PublishDialog
        open={Boolean(publishTarget)}
        title={publishTarget?.title}
        category={publishTarget?.category}
        categories={publishTarget?.categories}
        authorSlug={publishTarget?.authorSlug}
        storyLanguage={publishTarget?.language || 'en'}
        initialSkipEnglish={publishTarget?.skipEnglish === true}
        initialSkipMalayalam={publishTarget?.skipMalayalam === true}
        onPrepare={prepareLanguages}
        languages={publishTarget ? languageStatus({ ...publishTarget, catalog: settings.newsroom.languages }) : []}
        fixHref={publishTarget ? `/desk/compose?id=${publishTarget.id}` : ''}
        busy={publishing}
        onCancel={() => setPublishTarget(null)}
        onConfirm={confirmPublish}
      />
    </DeskLayout>
  );
};

export default DeskReview;
