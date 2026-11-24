import { getSupabaseAdmin } from './supabase-server';

function missingTable(message) {
  return /audit_events|article_revisions|contact_messages|schema cache|does not exist/i.test(message || '');
}

export async function recordAudit(event, supabase = getSupabaseAdmin()) {
  if (!supabase) return;
  const { error } = await supabase.from('audit_events').insert({
    actor_id: event.actorId || null,
    action: String(event.action || 'update').slice(0, 40),
    entity_type: String(event.entityType || 'record').slice(0, 40),
    entity_id: event.entityId ? String(event.entityId).slice(0, 80) : null,
    summary: String(event.summary || '').slice(0, 240),
    detail: event.detail && typeof event.detail === 'object' ? event.detail : {},
  });
  if (error && !missingTable(error.message)) {
    console.error('Audit log failed:', error.message);
  }
}

export async function snapshotArticle(existing, { actorId, reason }, supabase = getSupabaseAdmin()) {
  if (!supabase || !existing?.id) return;
  const { error } = await supabase.from('article_revisions').insert({
    article_id: existing.id,
    editor_id: actorId || null,
    reason: String(reason || '').slice(0, 80),
    title: existing.title || '',
    summary: existing.summary || '',
    full_content: existing.full_content || '',
    editorial_status: existing.editorial_status || '',
  });
  if (error && !missingTable(error.message)) {
    console.error('Article revision failed:', error.message);
  }
}

export async function clearArticleRevisions(articleId, supabase = getSupabaseAdmin()) {
  if (!supabase || !articleId) return;
  const { error } = await supabase.from('article_revisions').delete().eq('article_id', articleId);
  if (error && !missingTable(error.message)) {
    const err = new Error(error.message || 'Could not remove the earlier versions.');
    err.status = 500;
    throw err;
  }
}

export async function listArticleRevisions(articleId) {
  if (!articleId) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('article_revisions')
    .select('id, reason, title, editorial_status, created_at')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false })
    .limit(12);
  if (error) {
    if (!missingTable(error.message)) console.error('Article revisions failed:', error.message);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    reason: row.reason || '',
    title: row.title || '',
    status: row.editorial_status || '',
    createdAt: row.created_at,
  }));
}
