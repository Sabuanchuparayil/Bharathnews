'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';

function getToken() {
  return getSupabaseBrowser()?.auth?.getSession().then(r => r.data?.session?.access_token);
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── Employer KYC ──

export async function submitEmployerApplication(payload) {
  return apiFetch('/api/employer/apply', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMyEmployerApplication() {
  return apiFetch('/api/employer/apply');
}

export async function getKycUploadUrl(fileName, fileType) {
  return apiFetch('/api/employer/upload-kyc', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileType }),
  });
}

// ── Jobs ──

export async function getApprovedJobs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/jobs${qs ? `?${qs}` : ''}`);
}

export async function getJobBySlug(slug) {
  return apiFetch(`/api/jobs/${slug}`);
}

export async function createJob(payload) {
  return apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMyJobs() {
  return apiFetch('/api/jobs/mine');
}

// ── Classifieds ──

export async function getApprovedClassifieds(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/api/classifieds${qs ? `?${qs}` : ''}`);
}

export async function getClassifiedBySlug(slug) {
  return apiFetch(`/api/classifieds/${slug}`);
}

export async function createClassified(payload) {
  return apiFetch('/api/classifieds', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMyClassifieds() {
  return apiFetch('/api/classifieds/mine');
}

export async function getClassifiedImageUploadUrl(fileName, fileType) {
  return apiFetch('/api/classifieds/upload-image', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileType }),
  });
}

// ── Admin ──

export async function getAdminEmployerApplications() {
  return apiFetch('/api/admin/marketplace/employer-applications');
}

export async function reviewEmployerApplication(id, payload) {
  return apiFetch(`/api/admin/marketplace/employer-applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getAdminPendingJobs() {
  return apiFetch('/api/admin/marketplace/jobs');
}

export async function moderateJob(id, payload) {
  return apiFetch('/api/admin/marketplace/jobs', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...payload }),
  });
}

export async function getAdminPendingClassifieds() {
  return apiFetch('/api/admin/marketplace/classifieds');
}

export async function moderateClassified(id, payload) {
  return apiFetch('/api/admin/marketplace/classifieds', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...payload }),
  });
}
