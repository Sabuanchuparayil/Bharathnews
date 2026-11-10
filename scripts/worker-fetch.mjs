const WORKER = (process.env.WORKER_URL || process.env.NEXT_PUBLIC_WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev').replace(/\/$/, '');

export function workerFetch(path, options = {}) {
  const secret = process.env.WORKER_API_SECRET || '';
  if (!secret) {
    throw new Error('Set WORKER_API_SECRET before calling worker maintenance routes.');
  }
  return fetch(`${WORKER}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${secret}`,
    },
  });
}
