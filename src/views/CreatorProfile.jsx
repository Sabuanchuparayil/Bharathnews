'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, UserMinus, BadgeCheck, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import ShareButton from '../components/ShareButton';
import Layout from '../components/Layout';
import CreatorPostCard from '../components/CreatorPostCard';
import { useAuth } from '../context/AuthContext';
import {
  getCreatorProfileBySlug, getCreatorPostsByAuthor,
  followCreator, unfollowCreator, isFollowing,
} from '../services/creator';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'article', label: 'Articles' },
  { id: 'story', label: 'Stories' },
  { id: 'poem', label: 'Poems' },
  { id: 'journal', label: 'Journal' },
  { id: 'video', label: 'Videos' },
];

const CreatorProfile = ({ username: usernameProp, initialProfile = null }) => {
  const username = usernameProp;
  const { user } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(!initialProfile);

  useEffect(() => {
    const load = async () => {
      if (!initialProfile) setLoading(true);
      const p = initialProfile || await getCreatorProfileBySlug(username);
      setProfile(p);
      if (p) {
        const allPosts = await getCreatorPostsByAuthor(username);
        setPosts(allPosts.filter(post => post.visibility !== 'private' || post.authorId === user?.uid));
        if (user) {
          const f = await isFollowing(user.uid, username);
          setFollowing(f);
        }
      }
      setLoading(false);
    };
    load();
  }, [username, user, initialProfile]);

  const handleFollow = async () => {
    if (!user) { toast.info('Sign in to follow creators'); return; }
    const wasFollowing = following;
    const prevCount = profile.followerCount || 0;
    setFollowing(!wasFollowing);
    setProfile(prev => ({
      ...prev,
      followerCount: wasFollowing ? Math.max(0, prevCount - 1) : prevCount + 1,
    }));
    try {
      if (wasFollowing) {
        await unfollowCreator(user.uid, username);
      } else {
        await followCreator(user.uid, username);
      }
    } catch {
      setFollowing(wasFollowing);
      setProfile(prev => ({ ...prev, followerCount: prevCount }));
      toast.error('Something went wrong. Please try again.');
    }
  };

  const filteredPosts = activeTab === 'all' ? posts : posts.filter(p => p.type === activeTab);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout mainClassName="max-w-xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display font-bold text-2xl">Creator not found</h1>
        <p className="text-gray-500 mt-2">{'@' + username} doesn&apos;t exist yet.</p>
        <Link href="/creator/apply" className="btn-primary inline-block mt-6 px-6 py-2.5 rounded-xl">Become a Creator</Link>
      </Layout>
    );
  }

  const roleBadge = profile.role === 'vlogger' ? 'Community Vlogger' : 'Citizen Reporter';

  return (
    <Layout>
      <div className="relative">
        <div
          className="h-48 sm:h-56 bg-gradient-to-r from-brand-600 to-brand-800"
          style={profile.coverImage ? { backgroundImage: `url(${profile.coverImage})`, backgroundSize: 'cover' } : {}}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-28 h-28 rounded-2xl border-4 border-white dark:border-dark-surface-0 object-cover shadow-lg" />
            ) : (
              <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-dark-surface-0 bg-brand-100 flex items-center justify-center text-3xl font-bold text-brand-700">
                {profile.displayName?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">{profile.displayName}</h1>
                {profile.verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
              </div>
              <p className="text-gray-500">{'@' + profile.slug} · {roleBadge}</p>
              {profile.bio && <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-xl">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span><strong>{profile.followerCount || 0}</strong> followers</span>
                <span><strong>{profile.postCount || 0}</strong> posts</span>
                {profile.revenueShareEligible && <span className="text-green-600 font-semibold">Revenue Share Eligible</span>}
              </div>
            </div>
            <div className="flex gap-2 pb-2">
              <button onClick={handleFollow} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${following ? 'bg-gray-200 dark:bg-gray-700' : 'bg-brand-600 text-white'}`}>
                {following ? <><UserMinus className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>
              <ShareButton
                title={`${profile.displayName} on Bharath News`}
                text={profile.bio || `Follow @${profile.slug} for stories, articles, and more`}
                path={`/@${profile.slug}`}
                contentType="creator_profile"
              />
            </div>
          </div>

          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex gap-3 mt-4">
              {Object.entries(profile.socialLinks).map(([platform, url]) => url && (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 flex items-center gap-1">
                  {platform} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-8 overflow-x-auto scrollbar-hide pb-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredPosts.length === 0 ? (
              <p className="text-gray-500 col-span-full">No published content yet.</p>
            ) : (
              filteredPosts.map(post => <CreatorPostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatorProfile;
