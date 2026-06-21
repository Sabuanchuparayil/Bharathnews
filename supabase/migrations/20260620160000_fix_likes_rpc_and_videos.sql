-- Consolidated migration: likes RPC + video columns
-- Run in Supabase SQL Editor if not using supabase CLI migrations.

-- =============================================================================
-- 1. RPC for toggling article likes (bypasses RLS safely)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_article_likes(article_id UUID, delta INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE articles
  SET likes = GREATEST(0, COALESCE(likes, 0) + delta)
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to call this RPC
GRANT EXECUTE ON FUNCTION public.increment_article_likes(UUID, INTEGER) TO authenticated;

-- =============================================================================
-- 2. Video columns (channel_id, published_at) — idempotent
-- =============================================================================

ALTER TABLE videos ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_fetched_at ON videos(fetched_at DESC);
