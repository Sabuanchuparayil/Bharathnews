-- Marketplace: employer KYC, job postings, classifieds
-- Run in Supabase SQL Editor after deploying app code.

-- =============================================================================
-- EXTEND USER ROLES
-- =============================================================================

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('reader', 'contributor', 'vlogger', 'content_writer', 'admin', 'employer'));

-- =============================================================================
-- EMPLOYER APPLICATIONS (KYC)
-- =============================================================================

CREATE TABLE IF NOT EXISTS employer_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  trade_license_no TEXT DEFAULT '',
  country TEXT NOT NULL DEFAULT 'uae',
  city TEXT DEFAULT '',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  company_website TEXT DEFAULT '',
  company_description TEXT DEFAULT '',
  document_urls JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'resubmit')),
  admin_feedback TEXT DEFAULT '',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employer_applications_user ON employer_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_employer_applications_pending ON employer_applications(status, created_at DESC)
  WHERE status = 'pending';

-- =============================================================================
-- EMPLOYER PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS employer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  trade_license_no TEXT DEFAULT '',
  country TEXT DEFAULT 'uae',
  city TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  company_website TEXT DEFAULT '',
  company_description TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employer_profiles_slug ON employer_profiles(slug);

-- =============================================================================
-- JOB POSTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT DEFAULT '',
  company_name TEXT NOT NULL,
  company_logo_url TEXT DEFAULT '',
  job_type TEXT DEFAULT 'full-time'
    CHECK (job_type IN ('full-time', 'part-time', 'contract', 'temporary', 'internship')),
  industry TEXT DEFAULT '',
  gender_preference TEXT DEFAULT 'any'
    CHECK (gender_preference IN ('any', 'female', 'male')),
  country TEXT NOT NULL DEFAULT 'uae',
  city TEXT DEFAULT '',
  remote_ok BOOLEAN DEFAULT false,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'AED',
  benefits TEXT DEFAULT '',
  apply_url TEXT DEFAULT '',
  apply_email TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'expired')),
  admin_feedback TEXT DEFAULT '',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  published_at TIMESTAMPTZ,
  syndicated_to_sidra BOOLEAN DEFAULT false,
  sidra_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status, country, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_employer ON job_postings(employer_id, status);
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON job_postings(slug);
CREATE INDEX IF NOT EXISTS idx_job_postings_sidra ON job_postings(gender_preference, syndicated_to_sidra)
  WHERE gender_preference = 'female' AND status = 'approved';

-- =============================================================================
-- CLASSIFIEDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS classifieds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  price NUMERIC,
  price_currency TEXT DEFAULT 'AED',
  price_type TEXT DEFAULT 'fixed'
    CHECK (price_type IN ('fixed', 'negotiable', 'free', 'contact')),
  listing_type TEXT NOT NULL DEFAULT 'sell'
    CHECK (listing_type IN ('sell', 'buy', 'rent', 'service', 'wanted')),
  category TEXT NOT NULL DEFAULT 'general',
  country TEXT NOT NULL DEFAULT 'uae',
  city TEXT DEFAULT '',
  contact_method TEXT DEFAULT 'whatsapp'
    CHECK (contact_method IN ('whatsapp', 'call', 'email', 'chat')),
  contact_value TEXT NOT NULL,
  gender_target TEXT DEFAULT 'any'
    CHECK (gender_target IN ('any', 'female')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'sold')),
  admin_feedback TEXT DEFAULT '',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classifieds_status ON classifieds(status, country, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classifieds_user ON classifieds(user_id, status);
CREATE INDEX IF NOT EXISTS idx_classifieds_slug ON classifieds(slug);

-- =============================================================================
-- SIDRA AUTO-SYNC TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION route_female_jobs_to_sidra()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.gender_preference = 'female' THEN
    NEW.syndicated_to_sidra := true;
    NEW.sidra_synced_at := now();
  END IF;
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_route_female_jobs_to_sidra ON job_postings;
CREATE TRIGGER trg_route_female_jobs_to_sidra
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION route_female_jobs_to_sidra();

CREATE OR REPLACE FUNCTION set_classified_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    NEW.published_at := COALESCE(NEW.published_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_classified_published_at ON classifieds;
CREATE TRIGGER trg_classified_published_at
  BEFORE UPDATE ON classifieds
  FOR EACH ROW
  EXECUTE FUNCTION set_classified_published_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE employer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;

-- Employer applications: own read/write
CREATE POLICY employer_applications_own ON employer_applications FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY employer_applications_service ON employer_applications FOR ALL
  USING (auth.role() = 'service_role');

-- Employer profiles: public read, own write
CREATE POLICY employer_profiles_public_read ON employer_profiles FOR SELECT USING (true);
CREATE POLICY employer_profiles_own_write ON employer_profiles FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY employer_profiles_service ON employer_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Job postings: public read approved non-expired
CREATE POLICY job_postings_public_read ON job_postings FOR SELECT
  USING (status = 'approved' AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY job_postings_own_read ON job_postings FOR SELECT
  USING (auth.uid() = employer_id);

CREATE POLICY job_postings_employer_insert ON job_postings FOR INSERT
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY job_postings_employer_update ON job_postings FOR UPDATE
  USING (auth.uid() = employer_id AND status IN ('draft', 'pending', 'rejected'));

CREATE POLICY job_postings_service ON job_postings FOR ALL
  USING (auth.role() = 'service_role');

-- Classifieds: public read approved non-expired
CREATE POLICY classifieds_public_read ON classifieds FOR SELECT
  USING (status = 'approved' AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY classifieds_own_read ON classifieds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY classifieds_own_insert ON classifieds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY classifieds_own_update ON classifieds FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

CREATE POLICY classifieds_service ON classifieds FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- STORAGE BUCKETS (run via Dashboard or API if SQL insert fails)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('employer-kyc', 'employer-kyc', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('listing-images', 'listing-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- KYC: users upload to own folder
CREATE POLICY employer_kyc_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'employer-kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY employer_kyc_read_own ON storage.objects FOR SELECT
  USING (bucket_id = 'employer-kyc' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY employer_kyc_service ON storage.objects FOR ALL
  USING (bucket_id = 'employer-kyc' AND auth.role() = 'service_role');

-- Listing images: public read, authenticated upload to own folder
CREATE POLICY listing_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY listing_images_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY listing_images_service ON storage.objects FOR ALL
  USING (bucket_id = 'listing-images' AND auth.role() = 'service_role');
