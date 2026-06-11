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
let initPromise = null;

/** Lazy-init Firebase client SDK (browser only). Returns a promise. */
export async function initClientFirebase() {
  if (typeof window === 'undefined') return null;
  if (client) return client;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    client = {
      app,
      auth,
      db: getFirestore(app),
      googleProvider: new GoogleAuthProvider(),
    };
    return client;
  })();

  return initPromise;
}

/** Sync access — returns cached client or null. */
export function getClientFirebase() {
  if (typeof window === 'undefined') return null;
  if (!client) {
    initClientFirebase();
    return null;
  }
  return client;
}

export const getMessagingInstance = async () => {
  const fb = await initClientFirebase();
  if (!fb) return null;
  const { getMessaging, isSupported } = await import('firebase/messaging');
  const supported = await isSupported();
  return supported ? getMessaging(fb.app) : null;
};

export default null;
