import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import ShareButton from './ShareButton';
import { getCategoryColor } from '../utils/categoryColors';

const TYPE_LABELS = {
  article: 'Article',
  story: 'Story',
  poem: 'Poem',
  journal: 'Journal',
  video: 'Video',
};

const CreatorPostCard = ({ post }) => (
  <div className="glass-card-solid rounded-2xl overflow-hidden card-lift group relative">
    <Link to={`/creator/post/${post.id}`} className="block">
      {post.coverImage && (
        <img src={post.coverImage} alt="" className="w-full h-40 object-cover" loading="lazy" />
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{TYPE_LABELS[post.type] || post.type}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getCategoryColor(post.category)}`}>
            {post.category}
          </span>
        </div>
        <h3 className="font-display font-bold text-base text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views || 0}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes || 0}</span>
        </div>
      </div>
    </Link>
    <div className="absolute top-3 right-3">
      <ShareButton
        title={post.title}
        text={post.excerpt}
        path={`/creator/post/${post.id}`}
        contentType="creator_post"
        size="sm"
        className="bg-white/90 dark:bg-dark-surface-1/90 rounded-xl shadow-sm"
      />
    </div>
  </div>
);

export default CreatorPostCard;
