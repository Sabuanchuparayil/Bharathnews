import { getFirebaseToken } from './firebase-auth.js';

export const FIRESTORE_BASE = (projectId) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

export function parseFirestoreFields(fields = {}) {
  const out = {};
  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) out[key] = val.stringValue;
    else if ('integerValue' in val) out[key] = parseInt(val.integerValue, 10);
    else if ('doubleValue' in val) out[key] = val.doubleValue;
    else if ('booleanValue' in val) out[key] = val.booleanValue;
    else if ('timestampValue' in val) out[key] = val.timestampValue;
    else if ('arrayValue' in val) {
      out[key] = (val.arrayValue.values || []).map(v => v.stringValue || v);
    } else if ('mapValue' in val) {
      out[key] = parseFirestoreFields(val.mapValue.fields || {});
    }
  }
  return out;
}

export async function runQuery(env, structuredQuery, token) {
  const res = await fetch(`${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}:runQuery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ structuredQuery }),
  });
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.filter(d => d.document).map(d => ({
    id: d.document.name.split('/').pop(),
    ...parseFirestoreFields(d.document.fields),
  }));
}

export async function patchDocument(env, docPath, fields, token, updateMask = null) {
  const mask = updateMask || Object.keys(fields).map(f => `updateMask.fieldPaths=${f}`).join('&');
  const url = `https://firestore.googleapis.com/v1/${docPath}?${mask}`;
  const firestoreFields = {};
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string') firestoreFields[key] = { stringValue: val };
    else if (typeof val === 'number') firestoreFields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === 'boolean') firestoreFields[key] = { booleanValue: val };
    else if (Array.isArray(val)) firestoreFields[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
    else if (val && typeof val === 'object' && val._timestamp) firestoreFields[key] = { timestampValue: val._timestamp };
  }
  return fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ fields: firestoreFields }),
  });
}

export async function createDocument(env, collection, docId, fields, token, createOnly = false) {
  const precondition = createOnly ? '?currentDocument.exists=false' : '';
  const url = `${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/${collection}/${docId}${precondition}`;
  const firestoreFields = {};
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string') firestoreFields[key] = { stringValue: val };
    else if (typeof val === 'number') firestoreFields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === 'boolean') firestoreFields[key] = { booleanValue: val };
    else if (Array.isArray(val)) firestoreFields[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
    else if (val && typeof val === 'object' && val._timestamp) firestoreFields[key] = { timestampValue: val._timestamp };
  }
  return fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ fields: firestoreFields }),
  });
}
