'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { downloadSubscribers, getSubscribers } from '../services/admin';

const PAGE_SIZE = 100;

const AdminSubscribers = () => {
  const { isAdmin } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback((offset, replace) => {
    setLoadError('');
    return getSubscribers(PAGE_SIZE, offset)
      .then(result => {
        setSubscribers(prev => replace ? (result.subscribers || []) : [...prev, ...(result.subscribers || [])]);
        setTotal(result.total || 0);
        setHasMore(Boolean(result.hasMore));
      })
      .catch(err => {
        if (replace) {
          setSubscribers([]);
          setTotal(0);
          setHasMore(false);
        }
        setLoadError(err.message || 'Could not load subscribers.');
      });
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load(0, true);
  }, [isAdmin, load]);

  return (
    <AdminLayout
      title="Newsletter Subscribers"
      description={`${total.toLocaleString('en-IN')} subscribers`}
      actions={
        <button
          type="button"
          onClick={() => downloadSubscribers().catch(err => setLoadError(err.message || 'Could not export subscribers.'))}
          className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700"
        >
          Download CSV
        </button>
      }
    >
      <div className="glass-card-solid rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {loadError ? (
            <p className="p-6 text-center text-red-600">{loadError}</p>
          ) : subscribers.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No subscribers yet</p>
          ) : subscribers.map(sub => (
            <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{sub.email || sub.id}</p>
                {sub.source && <p className="text-xs text-gray-500">via {sub.source}</p>}
              </div>
            </div>
          ))}
        </div>
        {hasMore && !loadError && (
          <div className="p-4 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => {
                setLoadingMore(true);
                load(subscribers.length, false).finally(() => setLoadingMore(false));
              }}
              className="px-4 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 disabled:opacity-50"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubscribers;
