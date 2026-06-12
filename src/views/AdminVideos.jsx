'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import LoginPrompt from '../components/LoginPrompt';
import { useAuth } from '../context/AuthContext';
import { getVideos, deleteVideo } from '../services/admin';

const AdminVideos = () => {
  const { isAdmin, loading, user } = useAuth();
  const [videos, setVideos] = useState([]);

  const reload = () => getVideos(100).then(setVideos);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove video "${title || id}" from the catalog?`)) return;
    try {
      await deleteVideo(id);
      toast.success('Video removed');
      reload();
    } catch (err) {
      toast.error(err.message || 'Failed to delete video');
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
          <LoginPrompt nextPath="/admin/videos" showAdminHint />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showChatbot={false}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="font-display font-bold text-3xl mb-2">Video Catalog</h1>
        <p className="text-gray-500 mb-8">{videos.length} videos in Firestore</p>

        <div className="space-y-2">
          {videos.map(v => (
            <div key={v.id} className="glass-card-solid rounded-xl p-4 flex items-center gap-4">
              {v.thumbnailUrl && (
                <img src={v.thumbnailUrl} alt="" className="w-24 h-14 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{v.title || v.id}</p>
                <p className="text-xs text-gray-500">{v.channelName || v.channelId} · {v.language || 'en'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {v.videoUrl && (
                  <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                )}
                <button type="button" onClick={() => handleDelete(v.id, v.title)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30" aria-label="Delete">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AdminVideos;
