-- Security hardening: block self-role-escalation and self-approval of marketplace listings.
-- Deploy BEFORE going live with marketplace features.

-- =============================================================================
-- 1. USERS TABLE: prevent users from changing their own role
-- =============================================================================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS users_own_update ON users;

-- Users can only update safe profile columns (not role, not id)
CREATE POLICY users_own_update ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    role = (SELECT role FROM users WHERE id = auth.uid())
  );

-- =============================================================================
-- 2. EMPLOYER APPLICATIONS: prevent self-approval
-- =============================================================================

DROP POLICY IF EXISTS employer_applications_own ON employer_applications;

-- Users can read their own applications
CREATE POLICY employer_applications_own_read ON employer_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert new applications (forced to pending by DB default + API)
CREATE POLICY employer_applications_own_insert ON employer_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status IN ('pending'));

-- Users can update own applications only when in resubmit/rejected state,
-- and cannot change status to approved
CREATE POLICY employer_applications_own_update ON employer_applications FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('resubmit', 'rejected'))
  WITH CHECK (status IN ('pending'));

-- =============================================================================
-- 3. JOB POSTINGS: prevent inserting as 'approved' directly
-- =============================================================================

DROP POLICY IF EXISTS job_postings_employer_insert ON job_postings;
DROP POLICY IF EXISTS job_postings_employer_update ON job_postings;

-- Employers can only insert jobs with pending/draft status
CREATE POLICY job_postings_employer_insert ON job_postings FOR INSERT
  WITH CHECK (auth.uid() = employer_id AND status IN ('draft', 'pending'));

-- Employers can only update their own draft/pending/rejected jobs,
-- and cannot self-approve
CREATE POLICY job_postings_employer_update ON job_postings FOR UPDATE
  USING (auth.uid() = employer_id AND status IN ('draft', 'pending', 'rejected'))
  WITH CHECK (status IN ('draft', 'pending'));

-- =============================================================================
-- 4. CLASSIFIEDS: prevent inserting as 'approved' directly
-- =============================================================================

DROP POLICY IF EXISTS classifieds_own_insert ON classifieds;
DROP POLICY IF EXISTS classifieds_own_update ON classifieds;

-- Users can only insert classifieds with pending status
CREATE POLICY classifieds_own_insert ON classifieds FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status IN ('pending'));

-- Users can only update own pending/rejected classifieds,
-- and cannot self-approve
CREATE POLICY classifieds_own_update ON classifieds FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'))
  WITH CHECK (status IN ('pending'));

-- =============================================================================
-- 5. EMPLOYER PROFILES: restrict self-write to safe fields
-- =============================================================================

DROP POLICY IF EXISTS employer_profiles_own_write ON employer_profiles;

-- Users can read own profile (already covered by public read)
-- Users can update own profile but not change verified status
CREATE POLICY employer_profiles_own_update ON employer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    verified = (SELECT verified FROM employer_profiles WHERE user_id = auth.uid())
  );
