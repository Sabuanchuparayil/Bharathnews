-- Supabase Auth has no admin API that revokes every session by user id.
-- This deletes the user's refresh sessions so an open client cannot mint a new access token.
-- The access token already issued stays valid until it expires; server routes still reject it
-- through users.status.

CREATE OR REPLACE FUNCTION public.revoke_user_sessions(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'not allowed';
  END IF;
  IF target IS NULL THEN
    RAISE EXCEPTION 'target is required';
  END IF;

  DELETE FROM auth.mfa_amr_claims
  WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = target);

  DELETE FROM auth.refresh_tokens
  WHERE user_id = target::text
     OR session_id IN (SELECT id FROM auth.sessions WHERE user_id = target);

  DELETE FROM auth.sessions
  WHERE user_id = target;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_user_sessions(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_sessions(uuid) TO service_role;
