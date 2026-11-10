-- Editorial board / reporter profiles for Bharath News bylines.
-- Separate from Pravasi creator_profiles.

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  title TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  email TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_active_sort
  ON staff_profiles (is_active, sort_order ASC, display_name ASC);

ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_photo_url TEXT DEFAULT '';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_title TEXT DEFAULT '';

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_profiles_public_read ON staff_profiles;
CREATE POLICY staff_profiles_public_read ON staff_profiles FOR SELECT
  USING (is_active = true);

INSERT INTO staff_profiles (slug, display_name, title, photo_url, bio, sort_order, is_active)
VALUES (
  'bharath-news-desk',
  'Bharath News Desk',
  'Newsroom',
  '',
  'Official newsroom byline for The Bharath News.',
  0,
  true
)
ON CONFLICT (slug) DO NOTHING;
