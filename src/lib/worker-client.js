/**
 * Server-side calls to the Cloudflare worker. The browser never sees the API secret.
 * Manual triggers accept Authorization: Bearer WORKER_API_SECRET.
 */

export async function callWorker(pathname, searchParams = {}) {
  const base = process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, '');
  const secret = process.env.WORKER_API_SECRET;
  if (!base) {
    const error = new Error('Worker URL is not configured.');
    error.status = 500;
    throw error;
  }
  if (!secret) {
    const error = new Error('Worker API secret is not configured.');
    error.status = 500;
    throw error;
  }

  const url = new URL(pathname, `${base}/`);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Worker request failed.');
    error.status = res.status;
    throw error;
  }
  return data;
}
