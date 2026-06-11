import React from 'react';
import { CATEGORIES, CREATOR_CONTENT_TYPES } from '../config/feeds.config';

const ContentEditor = ({ form, onChange, isVlogger }) => {
  const availableTypes = isVlogger
    ? CREATOR_CONTENT_TYPES.filter(t => t.id === 'video' || t.id === 'article')
    : CREATOR_CONTENT_TYPES.filter(t => t.id !== 'video');

  const contentCategories = CATEGORIES.filter(c => !['all', 'breaking'].includes(c.id));

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Content Type</label>
        <select
          value={form.type}
          onChange={e => onChange('type', e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
        >
          {availableTypes.map(t => (
            <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => onChange('title', e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
          placeholder="Give your content a compelling title"
        />
      </div>

      {form.type === 'video' ? (
        <div>
          <label className="block text-sm font-medium mb-1.5">Video URL (YouTube / Instagram)</label>
          <input
            type="url"
            value={form.videoUrl}
            onChange={e => onChange('videoUrl', e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium mb-1.5">
          {form.type === 'poem' ? 'Poem' : form.type === 'journal' ? 'Journal Entry' : 'Content'}
        </label>
        <textarea
          value={form.body}
          onChange={e => onChange('body', e.target.value)}
          required
          rows={12}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm font-mono"
          placeholder="Write your content here. Malayalam is welcome!"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={e => onChange('category', e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
          >
            {contentCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {form.type === 'journal' && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Visibility</label>
            <select
              value={form.visibility}
              onChange={e => onChange('visibility', e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private (only you)</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Cover Image URL (optional)</label>
        <input
          type="url"
          value={form.coverImage}
          onChange={e => onChange('coverImage', e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Tags (comma-separated)</label>
        <input
          type="text"
          value={form.tags}
          onChange={e => onChange('tags', e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface-1 px-4 py-3 text-sm"
          placeholder="kerala, diaspora, opinion"
        />
      </div>
    </div>
  );
};

export default ContentEditor;
