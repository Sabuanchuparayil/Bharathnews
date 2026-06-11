import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, Heart, ArrowLeft } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import Layout from '../components/Layout';

const extractYouTubeId = (url) => {
  const match = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};
import { useAuth } from '../context/AuthContext';
import { getCreatorPost, trackCreatorPostView } from '../services/creator';
import { getCategoryColor } from '../utils/categoryColors';

const CreatorPost = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreatorPost(postId).then(p => {
      setPost(p);
      setLoading(false);
      if (p?.status === 'published') trackCreatorPostView(postId);
    }).catch(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <p>Post not found.</p>
      </Layout>
    );
  }

  const canView = post.status === 'published'
    || post.authorId === user?.uid;

  if (!canView) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <p>This content is not available.</p>
      </Layout>
    );
  }

  return (
    <Layout mainClassName="max-w-3xl mx-auto px-4 py-8">
      <Helmet>
        <title>{post.title} | @{post.authorSlug} | The Bharath News</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>

      <Link to={`/@${post.authorSlug}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to @{post.authorSlug}
      </Link>

      {post.coverImage && (
        <img src={post.coverImage} alt="" className="w-full h-64 object-cover rounded-2xl mb-6" />
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getCategoryColor(post.category)}`}>{post.category}</span>
        <span className="text-xs text-gray-500 uppercase">{post.type}</span>
      </div>

      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">{post.title}</h1>

      <div className="flex items-center justify-between gap-4 text-sm text-gray-500 mb-8">
        <div className="flex items-center gap-4">
          <Link to={`/@${post.authorSlug}`} className="text-brand-600 hover:underline">{post.authorName}</Link>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views || 0}</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes || 0}</span>
        </div>
        <ShareButton
          title={post.title}
          text={post.excerpt}
          path={`/creator/post/${postId}`}
          contentType="creator_post"
          showLabel
          size="lg"
        />
      </div>

      {post.type === 'video' && post.videoUrl && (
        <div className="mb-8">
          {extractYouTubeId(post.videoUrl) ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(post.videoUrl)}`}
                title={post.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
              Watch video →
            </a>
          )}
        </div>
      )}

      <div className={`prose prose-lg dark:prose-invert max-w-none ${post.type === 'poem' ? 'font-serif italic' : ''}`}>
        {post.body.split('\n').map((para, i) => (
          <p key={i} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{para}</p>
        ))}
      </div>

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400">#{tag}</span>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default CreatorPost;
