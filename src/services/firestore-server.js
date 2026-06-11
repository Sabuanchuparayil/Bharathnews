import {
  collection, doc, getDoc, getDocs,
  query, where, orderBy, limit,
} from 'firebase/firestore';
import { getServerDb } from '../lib/firebase-server';

/** Serialize Firestore Timestamps for RSC props */
export function serializeDoc(data) {
  if (!data) return data;
  const out = { ...data };
  if (out.publishedAt?.toDate) {
    out.publishedAt = { seconds: Math.floor(out.publishedAt.toDate().getTime() / 1000) };
  }
  if (out.createdAt?.toDate) {
    out.createdAt = { seconds: Math.floor(out.createdAt.toDate().getTime() / 1000) };
  }
  if (out.updatedAt?.toDate) {
    out.updatedAt = { seconds: Math.floor(out.updatedAt.toDate().getTime() / 1000) };
  }
  return out;
}

export async function getArticleBySlugServer(slug) {
  const db = getServerDb();
  const q = query(collection(db, 'articles'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return serializeDoc({ id: d.id, ...d.data() });
}

export async function getTrendingArticlesServer(count = 5) {
  const db = getServerDb();
  const q = query(collection(db, 'articles'), orderBy('views', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => serializeDoc({ id: d.id, ...d.data() }));
}

export async function getArticlesPageServer(category = null, pageSize = 20) {
  const db = getServerDb();
  let q;
  if (category && category !== 'all') {
    q = query(collection(db, 'articles'), where('category', '==', category), orderBy('publishedAt', 'desc'), limit(pageSize));
  } else {
    q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'), limit(pageSize));
  }
  const snapshot = await getDocs(q);
  const articles = snapshot.docs.map(d => serializeDoc({ id: d.id, ...d.data() }));
  return { articles, hasMore: snapshot.docs.length === pageSize };
}

export async function getCreatorProfileBySlugServer(slug) {
  const db = getServerDb();
  const ref = doc(db, 'creator_profiles', slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return serializeDoc({ id: snap.id, ...snap.data() });
}

export async function getCreatorPostServer(postId) {
  const db = getServerDb();
  const ref = doc(db, 'creator_posts', postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = serializeDoc({ id: snap.id, ...snap.data() });
  if (data.status !== 'published') return null;
  return data;
}
