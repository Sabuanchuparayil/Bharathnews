'use client';

import { withFirestore } from '@/lib/firebase-client';
import { slugify } from '../utils/slugify';

const CREATOR_ROLES = ['contributor', 'vlogger'];

export const isCreatorRole = (role) => CREATOR_ROLES.includes(role);

export const submitRoleApplication = async (userId, { requestedRole, bio, portfolioUrl, sampleWork }) =>
  withFirestore(async (db, { collection, query, where, limit, getDocs, addDoc, serverTimestamp }) => {
    const existing = await getDocs(
      query(collection(db, 'role_applications'), where('userId', '==', userId), limit(10))
    );
    const hasPending = existing.docs.some(d => d.data().status === 'pending');
    if (hasPending) throw new Error('PENDING_APPLICATION_EXISTS');

    return addDoc(collection(db, 'role_applications'), {
      userId,
      requestedRole,
      bio: bio || '',
      portfolioUrl: portfolioUrl || '',
      sampleWork: sampleWork || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  });

export const getPendingApplications = async (count = 50) =>
  withFirestore(async (db, { collection, query, where, limit, getDocs }) => {
    const q = query(
      collection(db, 'role_applications'),
      where('status', '==', 'pending'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, count);
  });

export const getUserApplication = async (userId) =>
  withFirestore(async (db, { collection, query, where, limit, getDocs }) => {
    const q = query(
      collection(db, 'role_applications'),
      where('userId', '==', userId),
      limit(10)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const sorted = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return sorted[0];
  });

export const reviewRoleApplication = async (applicationId, { approved, feedback, userId, requestedRole, displayName, photoURL }) =>
  withFirestore(async (db, { doc, updateDoc, serverTimestamp }) => {
    const appRef = doc(db, 'role_applications', applicationId);
    await updateDoc(appRef, {
      status: approved ? 'approved' : 'rejected',
      feedback: feedback || '',
      reviewedAt: serverTimestamp(),
    });

    if (approved) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: requestedRole });

      const username = await generateUsername(displayName, '');
      await upsertCreatorProfile(userId, {
        slug: username,
        displayName,
        photoURL,
        role: requestedRole,
        bio: '',
      });
    }
  });

export const generateUsername = async (displayName, email) => {
  let base = slugify(displayName) || slugify((email || '').split('@')[0]) || 'creator';
  let candidate = base;
  let suffix = 1;
  while (await getCreatorProfileBySlug(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export const upsertCreatorProfile = async (userId, data) =>
  withFirestore(async (db, { doc, getDoc, setDoc, serverTimestamp }) => {
    const profileRef = doc(db, 'creator_profiles', data.slug);
    const existing = await getDoc(profileRef);
    const payload = {
      userId,
      slug: data.slug,
      displayName: data.displayName || '',
      photoURL: data.photoURL || '',
      bio: data.bio || '',
      coverImage: data.coverImage || '',
      role: data.role || 'contributor',
      socialLinks: data.socialLinks || {},
      verified: data.verified || false,
      followerCount: existing.exists() ? (existing.data().followerCount || 0) : 0,
      postCount: existing.exists() ? (existing.data().postCount || 0) : 0,
      earningsBalance: existing.exists() ? (existing.data().earningsBalance || 0) : 0,
      revenueShareEligible: existing.exists() ? (existing.data().revenueShareEligible || false) : false,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    };
    await setDoc(profileRef, payload, { merge: true });
    const saved = await getDoc(profileRef);
    return saved.data();
  });

export const getCreatorProfileBySlug = async (slug) =>
  withFirestore(async (db, { doc, getDoc }) => {
    const ref = doc(db, 'creator_profiles', slug);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  });

export const getCreatorProfileByUserId = async (userId) =>
  withFirestore(async (db, { collection, query, where, limit, getDocs }) => {
    const q = query(collection(db, 'creator_profiles'), where('userId', '==', userId), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() };
  });

export const updateCreatorProfile = async (slug, updates) =>
  withFirestore(async (db, { doc, updateDoc, serverTimestamp }) => {
    const ref = doc(db, 'creator_profiles', slug);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  });

export const createCreatorPost = async (authorId, post) =>
  withFirestore(async (db, { collection, addDoc, serverTimestamp }) => {
    const profile = await getCreatorProfileByUserId(authorId);
    if (!profile) throw new Error('CREATOR_PROFILE_REQUIRED');

    const slug = slugify(post.title) || `post-${Date.now()}`;
    return addDoc(collection(db, 'creator_posts'), {
      authorId,
      authorName: profile.displayName,
      authorSlug: profile.slug,
      type: post.type,
      title: post.title,
      body: post.body,
      excerpt: (post.excerpt || post.body || '').slice(0, 200),
      coverImage: post.coverImage || '',
      videoUrl: post.videoUrl || '',
      category: post.category || 'opinion',
      tags: post.tags || [],
      status: post.status || 'pending',
      visibility: post.visibility || 'public',
      slug,
      views: 0,
      likes: 0,
      comments: 0,
      moderationFeedback: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: null,
    });
  });

export const updateCreatorPost = async (postId, updates) =>
  withFirestore(async (db, { doc, updateDoc, serverTimestamp }) => {
    const ref = doc(db, 'creator_posts', postId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  });

export const getCreatorPost = async (postId) =>
  withFirestore(async (db, { doc, getDoc }) => {
    const ref = doc(db, 'creator_posts', postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  });

export const getCreatorPostsByAuthor = async (authorSlug, type = null, status = 'published') =>
  withFirestore(async (db, { collection, query, where, limit, getDocs }) => {
    const q = query(
      collection(db, 'creator_posts'),
      where('authorSlug', '==', authorSlug),
      where('status', '==', status),
      limit(50)
    );
    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    posts.sort((a, b) => {
      const aTime = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
      const bTime = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    if (type) posts = posts.filter(p => p.type === type);
    return posts;
  });

export const getMyCreatorPosts = async (authorId) =>
  withFirestore(async (db, { collection, query, where, limit, getDocs }) => {
    const q = query(
      collection(db, 'creator_posts'),
      where('authorId', '==', authorId),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  });

export const getPendingCreatorPosts = async (count = 50) =>
  withFirestore(async (db, { collection, query, where, limit, getDocs }) => {
    const q = query(
      collection(db, 'creator_posts'),
      where('status', '==', 'pending'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, count);
  });

export const moderateCreatorPost = async (postId, { approved, feedback }) =>
  withFirestore(async (db, { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment }) => {
    const ref = doc(db, 'creator_posts', postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('POST_NOT_FOUND');
    const post = snap.data();

    await updateDoc(ref, {
      status: approved ? 'published' : 'rejected',
      moderationFeedback: feedback || '',
      publishedAt: approved ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });

    if (approved) {
      const profileRef = doc(db, 'creator_profiles', post.authorSlug);
      await updateDoc(profileRef, { postCount: increment(1) });

      if (post.type === 'article' && post.visibility === 'public') {
        await addDoc(collection(db, 'articles'), {
          title: post.title,
          slug: `${post.authorSlug}-${post.slug}`,
          summary: post.excerpt,
          fullContent: post.body,
          imageUrl: post.coverImage || '',
          category: post.category,
          topics: post.tags,
          source: 'Bharath News Community',
          author: post.authorName,
          authorSlug: post.authorSlug,
          creatorPostId: postId,
          isCitizenContent: true,
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          views: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          score: 5,
        });
      }
    }
  });

export const trackCreatorPostView = async (postId) =>
  withFirestore(async (db, { doc, updateDoc, increment }) => {
    const viewedKey = `creator_viewed_${postId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(viewedKey)) return;
    const ref = doc(db, 'creator_posts', postId);
    await updateDoc(ref, { views: increment(1) });
    if (typeof window !== 'undefined') sessionStorage.setItem(viewedKey, '1');
  });

export const followCreator = async (followerId, creatorSlug) =>
  withFirestore(async (db, { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment }) => {
    const followId = `${followerId}_${creatorSlug}`;
    const ref = doc(db, 'follows', followId);
    const existing = await getDoc(ref);
    if (existing.exists()) return false;

    await setDoc(ref, {
      followerId,
      creatorSlug,
      createdAt: serverTimestamp(),
    });
    const profileRef = doc(db, 'creator_profiles', creatorSlug);
    await updateDoc(profileRef, { followerCount: increment(1) });
    return true;
  });

export const unfollowCreator = async (followerId, creatorSlug) =>
  withFirestore(async (db, { doc, getDoc, updateDoc, increment }) => {
    const followId = `${followerId}_${creatorSlug}`;
    const ref = doc(db, 'follows', followId);
    const existing = await getDoc(ref);
    if (!existing.exists()) return false;

    await updateDoc(ref, { active: false });
    const profileRef = doc(db, 'creator_profiles', creatorSlug);
    await updateDoc(profileRef, { followerCount: increment(-1) });
    return true;
  });

export const isFollowing = async (followerId, creatorSlug) =>
  withFirestore(async (db, { doc, getDoc }) => {
    const ref = doc(db, 'follows', `${followerId}_${creatorSlug}`);
    const snap = await getDoc(ref);
    return snap.exists() && snap.data().active !== false;
  });

export const getFeaturedCreators = async (count = 6) =>
  withFirestore(async (db, { collection, query, limit, getDocs }) => {
    const q = query(collection(db, 'creator_profiles'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
      .slice(0, count);
  });

export const checkRevenueShareEligibility = async (creatorSlug) => {
  const profile = await getCreatorProfileBySlug(creatorSlug);
  if (!profile) return false;

  const posts = await getCreatorPostsByAuthor(creatorSlug);
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const eligible = totalViews >= 10000 && posts.length >= 5;

  if (eligible && !profile.revenueShareEligible) {
    await updateCreatorProfile(creatorSlug, { revenueShareEligible: true });
  }
  return eligible;
};
