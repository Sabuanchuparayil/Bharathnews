import { readFileSync, existsSync } from 'fs';
import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const ALLOWED_ROLES = ['reader', 'contributor', 'vlogger', 'content_writer', 'admin'];

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  if (existsSync(trimmed)) {
    return JSON.parse(readFileSync(trimmed, 'utf8'));
  }

  return null;
}

export function getAdminApp() {
  if (getApps().length) return getApp();

  const sa = parseServiceAccount();
  if (!sa) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured on the server.');
  }

  return initializeApp({
    credential: cert(sa),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || sa.project_id,
  });
}

export async function verifyAdminRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: 'Missing authorization token.', status: 401 };
  }

  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(token);
    const db = getFirestore(app);
    const userDoc = await db.collection('users').doc(decoded.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return { error: 'Admin access required.', status: 403 };
    }

    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    return { error: err?.message || 'Invalid token.', status: 401 };
  }
}

export async function createUserWithRole({ email, password, displayName, role }) {
  if (!email?.includes('@')) throw new Error('Valid email is required.');
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (!ALLOWED_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);

  const app = getAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const normalizedEmail = email.trim().toLowerCase();
  const name = (displayName || normalizedEmail.split('@')[0]).trim();

  let userRecord;
  try {
    userRecord = await auth.createUser({
      email: normalizedEmail,
      password,
      displayName: name,
      emailVerified: true,
    });
  } catch (err) {
    if (err?.code === 'auth/email-already-exists') {
      const err409 = new Error('A user with this email already exists. Change their role in the list below.');
      err409.status = 409;
      throw err409;
    }
    throw err;
  }

  await db.collection('users').doc(userRecord.uid).set({
    email: normalizedEmail,
    displayName: name,
    role,
    language: 'all',
    bookmarks: [],
    likes: [],
    interests: { categories: {}, topics: [], sources: {}, readingTimes: {} },
    createdAt: FieldValue.serverTimestamp(),
  });

  return { uid: userRecord.uid, email: normalizedEmail, displayName: name, role };
}

const TRANSLATION_LANGS = new Set(['ml', 'hi', 'ta', 'te', 'kn', 'bn', 'en']);

export async function getArticleBySlugAdmin(slug) {
  const db = getFirestore(getAdminApp());
  const snap = await db.collection('articles').where('slug', '==', slug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function saveArticleTranslation(articleId, langCode, translation) {
  if (!TRANSLATION_LANGS.has(langCode)) throw new Error(`Invalid language: ${langCode}`);
  const db = getFirestore(getAdminApp());
  await db.collection('articles').doc(articleId).set({
    translations: {
      [langCode]: {
        title: translation.title || '',
        summary: translation.summary || '',
        fullContent: translation.fullContent || '',
        machineAssisted: translation.machineAssisted !== false,
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
  }, { merge: true });
}
