'use client';

import { getDbAsync, firestoreOps } from '@/lib/firebase-client';

export async function getActiveSponsors(placement = 'sidebar') {
  const db = await getDbAsync();
  if (!db) return [];
  const { collection, query, where, getDocs } = await firestoreOps();
  const q = query(
    collection(db, 'sponsors'),
    where('active', '==', true),
    where('placement', '==', placement)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
