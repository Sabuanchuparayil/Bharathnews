import { timingSafeEqual } from 'crypto';

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyDeskIngestRequest(request) {
  const secret = process.env.DESK_INGEST_SECRET || '';
  if (!secret) {
    return { error: 'Desk ingest is not configured. Set DESK_INGEST_SECRET.', status: 503 };
  }

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const apiKey = (request.headers.get('x-api-key') || '').trim();
  const token = bearer || apiKey;

  if (!token || !safeEqual(token, secret)) {
    return { error: 'Unauthorized.', status: 401 };
  }

  return {
    uid: null,
    role: 'content_writer',
    displayName: 'Claude Cowork',
    email: 'cowork@thebharathnews.com',
  };
}
