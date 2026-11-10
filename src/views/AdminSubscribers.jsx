'use client';

import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { getSubscribers } from '../services/admin';

const AdminSubscribers = () => {
  const { isAdmin } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    getSubscribers(200)
      .then(result => {
        setSubscribers(result.subscribers || []);
        setTotal(result.total || 0);
      })
      .catch(() => {
        setSubscribers([]);
        setTotal(0);
      });
  }, [isAdmin]);

  return (
    <AdminLayout title="Newsletter Subscribers" description={`${total.toLocaleString('en-IN')} subscribers`}>
      <div className="glass-card-solid rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {subscribers.length === 0 ? (
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
      </div>
    </AdminLayout>
  );
};

export default AdminSubscribers;
