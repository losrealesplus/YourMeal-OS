-- LOCAL LAB ONLY: explicit prerequisite exposed by the real E2E.
-- The frozen migrations are unchanged. Do not apply this file to production.
-- cr_order_writer evaluates can_operate_custom_batch() through RLS during
-- guard_legacy_offer(). auth.uid() was executable but its schema was inaccessible.
-- This grants name resolution only; no auth table access, role membership,
-- BYPASSRLS, LOGIN, or function replacement is introduced.
BEGIN;
DO $$ BEGIN
 IF (SELECT rolsuper OR rolbypassrls OR rolcanlogin FROM pg_roles WHERE rolname='cr_order_writer')
 THEN RAISE EXCEPTION 'UNSAFE_LOCAL_WRITER'; END IF;
 IF NOT has_function_privilege('cr_order_writer','auth.uid()','EXECUTE')
 THEN RAISE EXCEPTION 'MISSING_AUTH_UID_EXECUTE'; END IF;
END $$;
GRANT USAGE ON SCHEMA auth TO cr_order_writer;
COMMIT;
