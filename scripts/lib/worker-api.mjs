/**
 * Headers for authenticated Cloudflare Worker pipeline calls.
 * Set WORKER_API_SECRET in workers/secrets.env or the environment.
 */
export function workerAuthHeaders(extra = {}) {
  const headers = { ...extra };
  const secret = process.env.WORKER_API_SECRET;
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}
