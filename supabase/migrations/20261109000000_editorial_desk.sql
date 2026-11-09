-- Editorial desk: drafts, AI-assisted flag, image credit, cover uploads.
-- Run in the Supabase SQL editor after deploying the newsroom pages.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_ai_assisted BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS editor_notes TEXT DEFAULT '';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_credit TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_articles_editorial_queue
  ON articles (editorial_status, created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('article-images', 'article-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY article_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

CREATE POLICY article_images_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'article-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY article_images_service ON storage.objects FOR ALL
  USING (bucket_id = 'article-images' AND auth.role() = 'service_role');
