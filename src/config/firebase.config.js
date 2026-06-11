'use client';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let client = null;

/** Lazy-init Firebase client SDK (browser only). Auth must init before Firestore. */
export function getClientFirebase() {
  if (typeof window === 'undefined') return null;
  if (client) return client;

  const { initializeApp, getApps } = require('firebase/app');
  const { getAuth, GoogleAuthProvider } = require('firebase/auth');
  const { getFirestore } = require('firebase/firestore');

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  client = {
    app,
    auth,
    db: getFirestore(app),
    googleProvider: new GoogleAuthProvider(),
  };
  return client;
}

export const getMessagingInstance = async () => {
  const fb = getClientFirebase();
  if (!fb) return null;
  const { getMessaging, isSupported } = await import('firebase/messaging');
  const supported = await isSupported();
  return supported ? getMessaging(fb.app) : null;
};

export default null;
