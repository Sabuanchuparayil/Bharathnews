-- Account status: active / suspended / deactivated.
-- Enforcement is two-layered: the API sets an auth ban (user cannot sign in or refresh a
-- session) and records the status here so the admin UI and server checks can see it.

ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_changed_by UUID;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'suspended', 'deactivated'));

CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- Signed-in users must never change their own status (users_own_update only guards `role`).
CREATE OR REPLACE FUNCTION public.protect_user_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.status := OLD.status;
    NEW.status_reason := OLD.status_reason;
    NEW.status_changed_at := OLD.status_changed_at;
    NEW.status_changed_by := OLD.status_changed_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_status ON users;
CREATE TRIGGER protect_user_status
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_status();
