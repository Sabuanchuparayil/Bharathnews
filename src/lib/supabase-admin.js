import { getSupabaseAdmin } from './supabase-server';
import { rowToApp } from '@/lib/db-mapper';

export const ALLOWED_ROLES = ['reader', 'contributor', 'vlogger', 'content_writer', 'admin', 'employer'];

const TRANSLATION_LANGS = new Set(['ml', 'hi', 'ta', 'te', 'kn', 'bn', 'en', 'ar']);

export async function verifyAdminRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: 'Missing authorization token.', status: 401 };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { error: 'Invalid token.', status: 401 };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { error: 'Admin access required.', status: 403 };
    }

    return { uid: user.id, email: user.email };
  } catch (err) {
    return { error: err?.message || 'Invalid token.', status: 401 };
  }
}

export async function createUserWithRole({ email, password, displayName, role }) {
  if (!email?.includes('@')) throw new Error('Valid email is required.');
  if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (!ALLOWED_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);

  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();
  const name = (displayName || normalizedEmail.split('@')[0]).trim();

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (error) {
    if (error.message?.includes('already') || error.status === 422) {
      const err409 = new Error('A user with this email already exists. Change their role in the list below.');
      err409.status = 409;
      throw err409;
    }
    throw error;
  }

  await supabase.from('users').upsert({
    id: data.user.id,
    email: normalizedEmail,
    display_name: name,
    role,
    language: 'all',
    bookmarks: [],
    likes: [],
    interests: { categories: {}, topics: [], sources: {}, readingTimes: {} },
  });

  return { uid: data.user.id, email: normalizedEmail, displayName: name, role };
}

export async function getArticleBySlugAdmin(slug) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToApp(data);
}

export async function saveArticleTranslation(articleId, langCode, translation) {
  if (!TRANSLATION_LANGS.has(langCode)) throw new Error(`Invalid language: ${langCode}`);
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('articles')
    .select('translations')
    .eq('id', articleId)
    .single();

  const translations = existing?.translations || {};
  translations[langCode] = {
    title: translation.title || '',
    summary: translation.summary || '',
    fullContent: translation.fullContent || '',
    machineAssisted: translation.machineAssisted !== false,
    provider: translation.provider || 'google-nmt',
    updatedAt: new Date().toISOString(),
  };

  await supabase.from('articles').update({ translations }).eq('id', articleId);
}

export async function markArticleTelegramPosted(articleId) {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('articles')
    .select('distributed')
    .eq('id', articleId)
    .single();

  const distributed = { ...(existing?.distributed || {}), telegram: true };
  await supabase.from('articles').update({
    telegram_posted_at: new Date().toISOString(),
    distributed,
  }).eq('id', articleId);
}
