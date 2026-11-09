-- Email OTP verification and account profile details.
-- Run in the Supabase SQL editor. Existing accounts stay email-verified.
-- New sign-ups must enter the 6-digit code. Everyone fills residency details once.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT '';

UPDATE users
SET email_verified = true,
    email_verified_at = COALESCE(email_verified_at, created_at, now())
WHERE email_verified IS DISTINCT FROM true;

-- Public creator fields only. Phone, WhatsApp, date of birth, and nationality
-- stay on users, which readers cannot query for other people.
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS email_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_id UUID,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email_created
  ON email_otps (email, created_at DESC);

ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Signed-in users must not flip their own verification or profile_complete flag.
CREATE OR REPLACE FUNCTION public.protect_email_verified()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.email_verified := OLD.email_verified;
    NEW.email_verified_at := OLD.email_verified_at;
    NEW.profile_complete := OLD.profile_complete;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_email_verified ON users;
CREATE TRIGGER protect_email_verified
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_email_verified();
