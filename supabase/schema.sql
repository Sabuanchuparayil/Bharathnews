-- The Bharath News — Supabase schema (run in SQL Editor after creating project)
-- Enable Google + Email auth in Dashboard → Authentication → Providers before going live.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'india',
  subcategory TEXT,
  source TEXT,
  source_url TEXT,
  author TEXT DEFAULT 'The Bharath News AI',
  author_slug TEXT,
  language TEXT DEFAULT 'en',
  region TEXT DEFAULT 'india',
  score INTEGER DEFAULT 5,
  quality_score NUMERIC DEFAULT 6,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  topics TEXT[] DEFAULT '{}',
  editorial_status TEXT DEFAULT 'published',
  translations JSONB DEFAULT '{}',
  distributed JSONB DEFAULT '{"telegram":false,"facebook":false,"whatsapp":false}',
  cluster_id TEXT,
  creator_post_id UUID,
  is_citizen_content BOOLEAN DEFAULT false,
  telegram_posted_at TIMESTAMPTZ,
  facebook_posted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_articles (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source TEXT,
  source_id TEXT,
  category TEXT DEFAULT 'india',
  subcategory TEXT,
  region TEXT DEFAULT 'india',
  language TEXT DEFAULT 'en',
  image_url TEXT,
  status TEXT DEFAULT 'pending_ai',
  editorial_status TEXT DEFAULT 'pending',
  quality_score NUMERIC,
  topics TEXT[] DEFAULT '{}',
  detected_language TEXT,
  cluster_id TEXT,
  reject_reason TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'reader' CHECK (role IN ('reader', 'contributor', 'vlogger', 'content_writer', 'admin')),
  language TEXT DEFAULT 'all',
  interests JSONB DEFAULT '{"categories":{},"topics":[],"sources":{},"readingTimes":{}}',
  bookmarks UUID[] DEFAULT '{}',
  likes UUID[] DEFAULT '{}',
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT UNIQUE,
  title TEXT,
  thumbnail TEXT,
  channel TEXT,
  channel_id TEXT,
  category TEXT,
  language TEXT DEFAULT 'en',
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'rss',
  category TEXT DEFAULT 'india',
  subcategory TEXT,
  region TEXT DEFAULT 'india',
  language TEXT DEFAULT 'en',
  enabled BOOLEAN DEFAULT true,
  trust_weight NUMERIC DEFAULT 0.85,
  last_fetched_at TIMESTAMPTZ,
  last_error TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS distribution_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'facebook')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_distribution_jobs_pending
  ON distribution_jobs (status, next_retry_at)
  WHERE status IN ('pending', 'failed');

CREATE TABLE IF NOT EXISTS role_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL,
  bio TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  sample_work TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  feedback TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS creator_profiles (
  slug TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  role TEXT DEFAULT 'contributor',
  social_links JSONB DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  earnings_balance NUMERIC DEFAULT 0,
  revenue_share_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  author_slug TEXT,
  type TEXT DEFAULT 'article',
  title TEXT NOT NULL,
  body TEXT,
  excerpt TEXT,
  cover_image TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  category TEXT DEFAULT 'opinion',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  visibility TEXT DEFAULT 'public',
  slug TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  moderation_feedback TEXT DEFAULT '',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_slug TEXT REFERENCES creator_profiles(slug) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_editorial ON articles(editorial_status);
CREATE INDEX IF NOT EXISTS idx_raw_articles_status ON raw_articles(status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_creator_posts_author ON creator_posts(author_id, status);
CREATE INDEX IF NOT EXISTS idx_creator_posts_slug ON creator_posts(author_slug, status);

-- =============================================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'reader'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Default site settings
INSERT INTO site_settings (key, value) VALUES ('site', '{
  "siteName": "The Bharath News",
  "tagline": "AI-Powered News for India & GCC",
  "targetLanguages": "ml,hi,ta,te,kn,bn,ar",
  "qualityThreshold": 6,
  "pipeline": {"rssIngestEnabled": true}
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Articles: public read for published
CREATE POLICY articles_public_read ON articles FOR SELECT
  USING (editorial_status = 'published' OR editorial_status IS NULL);

CREATE POLICY articles_service_all ON articles FOR ALL
  USING (auth.role() = 'service_role');

-- Users: own profile read/write
CREATE POLICY users_own_read ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_own_update ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY users_service_all ON users FOR ALL
  USING (auth.role() = 'service_role');

-- Subscribers: anyone can insert
CREATE POLICY subscribers_insert ON subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY subscribers_service_all ON subscribers FOR ALL
  USING (auth.role() = 'service_role');

-- Videos, sources, site_settings: public read
CREATE POLICY videos_public_read ON videos FOR SELECT USING (true);
CREATE POLICY videos_service_all ON videos FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY sources_public_read ON sources FOR SELECT USING (true);
CREATE POLICY sources_service_all ON sources FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY site_settings_public_read ON site_settings FOR SELECT USING (true);
CREATE POLICY site_settings_service_all ON site_settings FOR ALL USING (auth.role() = 'service_role');

-- Raw articles: service role only (pipeline)
CREATE POLICY raw_articles_service_all ON raw_articles FOR ALL
  USING (auth.role() = 'service_role');

-- Creator tables
CREATE POLICY creator_profiles_public_read ON creator_profiles FOR SELECT USING (true);
CREATE POLICY creator_profiles_own_write ON creator_profiles FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY creator_posts_public_read ON creator_posts FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY creator_posts_own_write ON creator_posts FOR ALL
  USING (auth.uid() = author_id);

CREATE POLICY role_applications_own ON role_applications FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY follows_own ON follows FOR ALL
  USING (auth.uid() = follower_id);

-- Service role bypass for creator/admin operations
CREATE POLICY creator_profiles_service ON creator_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY creator_posts_service ON creator_posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY role_applications_service ON role_applications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY follows_service ON follows FOR ALL USING (auth.role() = 'service_role');
