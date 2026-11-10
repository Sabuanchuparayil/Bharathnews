'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';
import { deskAuthHeaders } from '@/lib/desk-client';
import { isHttpUrl } from '@/lib/profile-fields';

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 60;
export const PASSWORD_MIN = 8;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function db() {
  const supabase = getSupabaseBrowser();
  if (!supabase) throw new Error('Authentication unavailable. Please refresh and try again.');
  return supabase;
}

/** Update the signed-in user's own display name / photo. Role is never touched. */
export async function updateOwnProfile(userId, { displayName, photoURL }) {
  if (typeof userId !== 'string' || !userId) throw new Error('Not signed in.');
  if (typeof displayName !== 'string') throw new Error('Enter a display name.');
  const name = displayName.trim();
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) {
    throw new Error(`Display name must be ${DISPLAY_NAME_MIN}-${DISPLAY_NAME_MAX} characters.`);
  }
  const photo = typeof photoURL === 'string' ? photoURL.trim() : '';
  if (photo && !isHttpUrl(photo)) throw new Error('Photo must be a valid http(s) URL.');

  const { error } = await db()
    .from('users')
    .update({ display_name: name, photo_url: photo || null })
    .eq('id', userId);
  if (error) throw new Error(error.message || 'Could not save your profile.');
  return { displayName: name, photoURL: photo };
}

/** Upload a profile image through the signed-upload endpoint and return its public URL. */
export async function uploadProfileImage(file) {
  if (!file || typeof file.type !== 'string') throw new Error('Choose an image first.');
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Only JPEG, PNG, or WebP images are allowed.');
  if (file.size > IMAGE_MAX_BYTES) throw new Error('Image must be 5 MB or smaller.');

  const headers = await deskAuthHeaders();
  const res = await fetch('/api/profile/upload-image', {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileType: file.type }),
  });
  const signed = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(signed.error || 'Upload failed.');

  const put = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!put.ok) throw new Error('Could not upload the photo.');
  return signed.publicUrl;
}

/**
 * Change the signed-in user's password. The current password is re-verified first so a
 * hijacked/unattended session cannot silently take over the account.
 */
export async function changeOwnPassword({ email, currentPassword, newPassword }) {
  if (typeof email !== 'string' || !email.includes('@')) throw new Error('Not signed in.');
  if (typeof currentPassword !== 'string' || !currentPassword) throw new Error('Enter your current password.');
  if (typeof newPassword !== 'string' || newPassword.length < PASSWORD_MIN) {
    throw new Error(`New password must be at least ${PASSWORD_MIN} characters.`);
  }
  if (newPassword === currentPassword) throw new Error('New password must be different from the current one.');

  const supabase = db();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: currentPassword,
  });
  if (verifyError) throw new Error('Current password is incorrect.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message || 'Could not update your password.');
}
