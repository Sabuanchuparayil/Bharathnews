'use client';

import { initClientFirebase } from '@/config/firebase.config';

let firestoreModule = null;

export async function getDbAsync() {
  const fb = await initClientFirebase();
  return fb?.db ?? null;
}

export function getDb() {
  // Sync accessor — returns cached instance or null on first call
  const { getClientFirebase } = require('@/config/firebase.config');
  return getClientFirebase()?.db ?? null;
}

export function getAuth() {
  const { getClientFirebase } = require('@/config/firebase.config');
  return getClientFirebase()?.auth ?? null;
}

export function getGoogleProvider() {
  const { getClientFirebase } = require('@/config/firebase.config');
  return getClientFirebase()?.googleProvider ?? null;
}

export async function firestoreOps() {
  if (!firestoreModule) {
    firestoreModule = await import('firebase/firestore');
  }
  return firestoreModule;
}

/** Run a Firestore callback with a live db instance and loaded operators. */
export async function withFirestore(fn) {
  const db = await getDbAsync();
  if (!db) throw new Error('Firebase unavailable');
  const ops = await firestoreOps();
  return fn(db, ops);
}
