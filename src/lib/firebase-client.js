'use client';

import { getClientFirebase } from '@/config/firebase.config';

let firestoreModule = null;

export function getDb() {
  return getClientFirebase()?.db ?? null;
}

export function getAuth() {
  return getClientFirebase()?.auth ?? null;
}

export function getGoogleProvider() {
  return getClientFirebase()?.googleProvider ?? null;
}

export async function firestoreOps() {
  if (!firestoreModule) {
    firestoreModule = await import('firebase/firestore');
  }
  return firestoreModule;
}
